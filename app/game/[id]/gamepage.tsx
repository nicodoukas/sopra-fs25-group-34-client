"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Game } from "@/types/game";
import { Player } from "@/types/player";
import { SongCard } from "@/types/songcard";
import GameHeader from "./gameHeader";

import { Button, Card, Form, Input, message, Typography } from "antd";

import { connectWebSocket } from "@/websocket/websocketService";
import { Client } from "@stomp/stompjs";

import "@/styles/game.css";

const { Title, Text } = Typography;

interface FormFieldProps {
  guessedTitle: string;
  guessedArtist: string;
}

const GamePage = ({ onGameEnd }: { onGameEnd: () => void }) => {
  const [messageAPI, contextHolder] = message.useMessage();
  const router = useRouter();
  const apiService = useApi();
  const params = useParams();
  const gameId = Array.isArray(params.id) ? params.id[0] : params.id!;
  const [game, setGame] = useState<Game>({} as Game);
  const [player, setPlayer] = useState<Player>({} as Player);
  const [audioState, setAudioState] = useState<boolean>(true); //True if song not yet played, false otherwise
  const [isPlaying, setIsPlaying] = useState<boolean>(false); //True if song is currently playing
  const [isFlipped, setIsFlipped] = useState<number | null>(null); //index of flipped SongCard
  const [placement, setPlacement] = useState<number | null>(null); //position of placement of SongCard
  const [songCard, setSongCard] = useState<SongCard | null>({} as SongCard); // SongCard of currentRound
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const gameRef = useRef<Game | null>(null);
  const [form] = Form.useForm(); //for guess
  const [guessed, setGuessed] = useState<boolean>(false);
  const [triggerUseEffect, setTriggerUseEffect] = useState<number>(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const handleWebSocketMessage = (message: string) => {
    const parsedMessage = JSON.parse(message);
    if (parsedMessage.event_type === "play-song") {
      playAudio();
    }
    if (parsedMessage.event_type === "start-new-round") {
      setGuessed(false);
      setAudioState(true);
      setPlacement(null);
      setIsPlaying(false);
      setTriggerUseEffect((prev) => prev + 1);
    }
  };

  const unlockAudio = () => {
    const silentAudio = new Audio();
    silentAudio.play().catch(() => {
    });
    setAudioUnlocked(true);
  };

  const playAudio = async (): Promise<void> => {
    setIsPlaying(true);
    const audio = new Audio(gameRef.current?.currentRound.songCard?.songURL);
    audio.volume = 0.8;
    audio.play();

    audio.onended = () => {
      setAudioState(false);
      setIsPlaying(false);
    };
  };

  const flipCard = function (index: number) {
    if (isFlipped === index) {
      setIsFlipped(null);
      return;
    } // if card already flipped
    setIsFlipped(index);
  };

  const addCard = function (index: number) {
    setPlacement(index);
  };

  const confirmPlacement = async (): Promise<void> => {
    //check if placement is correct
    const year = songCard?.year;
    let yearBefore = -1;
    let yearAfter = 3000;
    if (
      placement != null &&
      year != null
    ) {
      if (placement > 0) yearBefore = player?.timeline[placement - 1].year;
      if (placement < player.timeline.length) {
        yearAfter = player?.timeline[placement].year;
      }
      if (yearBefore <= year && yearAfter >= year) {
        messageAPI.success("Congratulations, your placement is correct!");
        //actually place the songCard into the timeline
        const userId = sessionStorage.getItem("id");
        const body = {
          "songCard": songCard,
          "position": placement,
        };
        try {
          await apiService.put(`/games/${gameId}/${userId}`, body);
        } catch (error) {
          if (error instanceof Error) {
            alert(`Something went wrong during the guess:\n${error.message}`);
            console.error(error);
          } else {
            console.error("An unknown error occurred during guess.");
          }
        }
      } else {
        messageAPI.warning("Wrong placement.");
      }
    }
    //startNewRound
    console.log("Sending start-new-round message...");
    if (stompClient?.connected) {
      (stompClient as Client).publish({
        destination: "/app/startNewRound",
        body: gameId ?? "",
      });
    }
  };

  const handleGuess = async (values: FormFieldProps) => {
    const body = {
      ...values,
      player: player,
    };
    const userId = sessionStorage.getItem("id");
    try {
      const correct = await apiService.post<boolean>(
        `/games/${gameId}/${userId}/guess`,
        body,
      );
      if (correct) {
        setGuessed(true);
        messageAPI.success("Congratulation, you guessed correct!");
        const updatedPlayer = await apiService.get<Player>(
          `/games/${gameId}/${userId}`,
        );
        setPlayer(updatedPlayer);
      } else {
        messageAPI.warning("Guess incorrect, try again.");
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the guess:\n${error.message}`);
        console.error(error);
      } else {
        console.error("An unknown error occurred during guess.");
      }
    }
  };

  const handleBuyCard = async () => {
    try {
      const updatedPlayer = await apiService.put<Player>(
        `/games/${gameId}/buy`,
        player.userId,
      );
      setPlayer(updatedPlayer);
      messageAPI.success("SongCard purchased and added to your timeline!");
    } catch (error) {
      if (error instanceof Error) {
        messageAPI.error(`Error: ${error.message}`);
      } else {
        messageAPI.error("Unknown error while buying a SongCard.");
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gameData = await apiService.get<Game>(`/games/${gameId}`);
        setGame(gameData);
        console.log("This is the game: ", gameData);
        setSongCard(gameData.currentRound?.songCard);
        const userId = sessionStorage.getItem("id");
        const playerData = await apiService.get<Player>(
          `/games/${gameId}/${userId}`,
        );
        setPlayer(playerData);
        console.log("This is the player: ", playerData);
      } catch (error) {
        alert("Failed to fetch game or player data.");
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [apiService, gameId, triggerUseEffect]);

  useEffect(() => {
    const client = connectWebSocket(handleWebSocketMessage, gameId);
    setStompClient(client);

    return () => {
      client?.deactivate();
    };
  }, []);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const handlePlayButtonClick = () => {
    if (stompClient?.connected) {
      (stompClient as Client).publish({
        destination: "/app/play",
        body: gameId ?? "",
      });
    }
  };

  if (!player || !game?.currentRound?.activePlayer) {
    return <div style={{ color: "white" }}>Loading...</div>;
  }

  return (
    <div
      className={"card-container"}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        flexDirection: "row",
        paddingTop: "80px",
        position: "relative",
        gap: "20px",
      }}
    >
      <GameHeader player={player} onBuyCard={handleBuyCard}></GameHeader>
      {contextHolder}
      <div
        style={{
          flex: "0 0 500px",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          width: "800px",
        }}
      >
        <Card
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#e5e1ca",
            alignItems: "center",
            paddingTop: "20px",
            textAlign: "center",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          <Title level={2} style={{ color: "black" }}>
            {game?.gameName || "{gameName}"}
          </Title>
          <div className="playButtonContainer">
            {songCard?.songURL &&
              player.userId == game.currentRound.activePlayer.userId && (
              <div
                className={`playButton ${isPlaying ? "playing" : ""}`}
                onClick={audioState && !isPlaying
                  ? handlePlayButtonClick
                  : undefined}
                style={{ pointerEvents: audioState ? "auto" : "none" }}
              >
                <img
                  src="/img/playsymbol.png"
                  alt="Play"
                  className="playIcon"
                />
              </div>
            )}
            {!audioUnlocked &&
              player.userId != game.currentRound.activePlayer.userId && (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <Button onClick={unlockAudio}>Enable Audio</Button>
              </div>
            )}
          </div>
          <div className="songCardContainer">
            {placement == null &&
              player.userId == game.currentRound.activePlayer.userId && (
              <div className="songCard">
                <Text strong style={{ fontSize: "30px" }}>?</Text>
              </div>
            )}
          </div>

          <div>
            <Title level={4} style={{ textAlign: "center" }}>
              Your Timeline
            </Title>
            {player.timeline && player.timeline.length > 0
              ? (
                <div className="timeline">
                  {player.timeline.map((card: SongCard, index: number) => (
                    <React.Fragment key={index}>
                      {player.userId ==
                          game?.currentRound.activePlayer.userId && (
                          placement == index
                            ? (
                              <div className="flipContainer">
                                <div className="songCard">
                                  <Text strong style={{ fontSize: "30px" }}>
                                    ?
                                  </Text>
                                </div>
                              </div>
                            )
                            : (
                              <div className="addButtonContainer">
                                <div
                                  className="addButton"
                                  onClick={() => addCard(index)}
                                >
                                  <img
                                    src="/img/plus.png"
                                    alt="add"
                                    className="plusIcon"
                                  />
                                </div>
                              </div>
                            )
                        )}

                      <div
                        key={index}
                        onClick={() => flipCard(index)}
                        className="flipContainer"
                      >
                        <div
                          className={`songCard ${
                            isFlipped === index ? "flipped" : ""
                          }`}
                        >
                          <div className="front">
                            <Text strong>{card.year}</Text>
                          </div>
                          <div className="back">
                            <Text
                              strong
                              style={{ fontSize: "14px", color: "#fefae0" }}
                            >
                              {card.title}
                            </Text>
                            <Text type="secondary" style={{ fontSize: "14px" }}>
                              {card.artist}
                            </Text>
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                  <div>
                    {player.userId == game.currentRound.activePlayer.userId && (
                      placement == player?.timeline?.length
                        ? (
                          <div className="flipContainer">
                            <div className="songCard">
                              <Text strong style={{ fontSize: "30px" }}>?</Text>
                            </div>
                          </div>
                        )
                        : (
                          <div className="addButtonContainer">
                            <div
                              className="addButton"
                              onClick={() => addCard(player.timeline.length)}
                            >
                              <img
                                src="/img/plus.png"
                                alt="add"
                                className="plusIcon"
                              />
                            </div>
                          </div>
                        )
                    )}
                  </div>
                </div>
              )
              : <Text type="secondary">No songcards in timeline.</Text>}
          </div>
          {(player.userId == game.currentRound.activePlayer.userId) &&
            (placement != null) && (!isPlaying) && (
            <Button onClick={confirmPlacement}>Confirm</Button>
          )}
          <Button style={{ marginTop: "30px" }} onClick={() => router.back()}>
            Back to Lobby-Screen
          </Button>
          <Button onClick={() => onGameEnd()}>End Game</Button>
        </Card>
      </div>
      <div style={{ flex: "0 0 300px", position: "absolute", right: 20 }}>
        <Card
          style={{
            backgroundColor: "#e5e1ca",
            width: "250px",
            textAlign: "center",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          <div>
            <Text strong style={{ fontSize: "20px", color: "black" }}>
              Guess
            </Text>
          </div>
          {guessed
            ? (
              <>
                <Text>You already guessed correct:)</Text>
              </>
            )
            : (
              <>
                <div>
                  <Form
                    form={form}
                    name="login"
                    size="large"
                    onFinish={handleGuess}
                    layout="vertical"
                  >
                    <Form.Item
                      name="guessedTitle"
                      rules={[{
                        required: true,
                        message: "Please enter the title",
                      }]}
                    >
                      <Input placeholder="Title" />
                    </Form.Item>
                    <Form.Item
                      name="guessedArtist"
                      rules={[{
                        required: true,
                        message: "Please enter the artist",
                      }]}
                    >
                      <Input placeholder="Artist" />
                    </Form.Item>
                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        block
                        style={{ color: "#283618" }}
                      >
                        check guess
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              </>
            )}
        </Card>
      </div>
    </div>
  );
};

export default GamePage;
