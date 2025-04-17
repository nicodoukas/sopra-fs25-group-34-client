"use client";

import React, {useEffect, useState} from "react";
import { useRouter, useParams } from "next/navigation";
import {useApi} from "@/hooks/useApi";
import { Button, Typography, Card } from "antd";
import "@ant-design/v5-patch-for-react-19";
import {Game} from "@/types/game";
import {Player} from "@/types/player";
import {SongCard} from "@/types/songcard";
import '@/styles/game.css';


const { Title, Text } = Typography;

const GamePage = () => {
  const router = useRouter();
  const apiService = useApi();
  const params = useParams();
  const gameId = params.id;
  const [game, setGame] = useState<Game>({} as Game);
  const [player, setPlayer] = useState<Player>({} as Player);
  const [audioState, setAudioState] = useState<Boolean>(true); //True if song not yet played, false otherwise
  const [isPlaying, setIsPlaying] = useState<Boolean>(false); //True if song is currently playing
  const [isFlipped, setIsFlipped] = useState<number | null>(null); //index of flipped SongCard
  const [placement, setPlacement] = useState<number | null>(null); //position of placement of SongCard
  const [songCard, setSongCard] = useState<SongCard | null>({} as SongCard); // SongCard of currentRound


  const playAudio = async (): Promise<void> => {
  setIsPlaying(true)
    const audio = new Audio(game.currentRound.songCard?.songURL);
    audio.play();

    audio.onended = () => {setAudioState(false); setIsPlaying(false)}
  }

  const flipCard = function (index: number) {
    if (isFlipped === index) {setIsFlipped(null); return;} // if card already flipped
    setIsFlipped(index)
  }

  const addCard = function (index: number) {
    setPlacement(index);

    console.log("CardPlacement: " + placement);
  }

  const confirmPlacement = async (): Promise<void> => {
    const userId = localStorage.getItem("id");
    const body = {
      "songCard": songCard,
      "position": placement,
    }
    await apiService.put(`/game/${gameId}/${userId}`, body);
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gameData = await apiService.get<Game>(`/games/${gameId}`);
        setGame(gameData);
        console.log("This is the game: ", gameData);
        setSongCard(gameData.currentRound?.songCard);
        const userId = localStorage.getItem("id");
        const playerData = await apiService.get<Player>(`/games/${gameId}/${userId}`);
        setPlayer(playerData);
        console.log("This is the player: ", playerData);
      } catch (error) {
        alert("Failed to fetch game or player data.");
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [apiService, gameId]);

  if (!player || !game?.currentRound?.activePlayer) {
    return <div style={{color: "white"}}>Loading...</div>;
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "black",
        flexDirection: "column",
        paddingTop: "80px",
        position: "relative",
      }}
    >
      {player && (
        <div className="coins">
          Coins: {player.coinBalance}
        </div>
      )}
      <Card
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "20px",
          width: "700px",
          textAlign: "center",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <Title level={2} style={{ color: "#1890ff" }}>
          {game?.gameName || "{gameName}"}
        </Title>
        <div className="playButtonContainer">
        {songCard?.songURL && player.userId == game.currentRound.activePlayer.userId && (
          <div className={`playButton ${isPlaying ? "playing" : ""}`}
               onClick={audioState && !isPlaying ? playAudio : undefined}
               style={{pointerEvents: audioState ? "auto" : "none"}}>
            <img src="/img/playsymbol.png" alt="Play" className="playIcon"/>
          </div>
        )}
        </div>
      <div className="songCardContainer">
        {placement == null && player.userId == game.currentRound.activePlayer.userId && (
          <div className="songCard">
            <Text strong>?</Text>
          </div>
        )}

      </div>

        <div>
          <Title level={4} style={{textAlign: "center"}}>Your Timeline</Title>
          {player.timeline && player.timeline.length > 0 ? (
            <div className="timeline">
              {player.timeline.map((card: SongCard, index:number) => (
                <React.Fragment key={index}>
                  {player.userId == game?.currentRound.activePlayer.userId && (
                    placement == index ? (
                      <div className="flipContainer">
                        <div className="songCard">
                          <Text strong>?</Text>
                        </div>
                      </div>

                    ) : (
                      <div className="addButtonContainer">
                        <div className="addButton" onClick={() => addCard(index)}>
                          <img src="/img/plus.png" alt="add" className="plusIcon"/>
                        </div>
                      </div>
                    )
                  )}

                  <div key={index} onClick={() => flipCard(index)} className="flipContainer">
                    <div className={`songCard ${isFlipped === index ? 'flipped' : ''}`}>
                      <div className="front">
                        <Text strong>{card.year}</Text>
                      </div>
                      <div className="back">
                        <Text strong style={{fontSize: "14px"}}>{card.title}</Text>
                        <Text type="secondary" style={{fontSize: "14px"}}>{card.artist}</Text>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
                <div>
                  {player.userId == game.currentRound.activePlayer.userId && (
                    placement == player?.timeline?.length ? (
                      <div className="flipContainer">
                        <div className="songCard">
                          <Text strong>?</Text>
                        </div>
                      </div>

                    ) : (
                      <div className="addButtonContainer">
                        <div className="addButton" onClick={() => addCard(player.timeline.length)}>
                          <img src="/img/plus.png" alt="add" className="plusIcon"/>
                        </div>
                      </div>
                    )
                  )}
                </div>
            </div>
          ) : (
            <Text type="secondary">No songcards in timeline.</Text>
          )}
        </div>
        <Button onClick={confirmPlacement}>Confirm</Button>
        <Button style={{ marginTop: "30px" }} onClick={() => router.back()}>
          Back to Lobby-Screen
        </Button>
      </Card>
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          fontSize: "14px",
          color: "#aaa",
        }}
      >
        Hitster by Group 24, SoPra FS25
      </div>
    </div>
  );
};

export default GamePage;
