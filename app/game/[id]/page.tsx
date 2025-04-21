"use client";

import React, {useEffect, useRef, useState} from "react";
import { useRouter, useParams } from "next/navigation";
import {useApi} from "@/hooks/useApi";
import { Button, Typography, Card } from "antd";
import "@ant-design/v5-patch-for-react-19";
import {Game} from "@/types/game";
import {Player} from "@/types/player";
import {SongCard} from "@/types/songcard";
import '@/styles/game.css';
import { connectWebSocket } from "@/websocket/websocketService";
import { Client } from "@stomp/stompjs";


const { Title, Text } = Typography;

const GamePage = () => {
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


  const handleWebSocketMessage = (message: string) => {
    const parsedMessage = JSON.parse(message);
    if (parsedMessage.event_type === "play-song") {
        playAudio();
    }
  };

  const playAudio = async (): Promise<void> => {
    setIsPlaying(true);
    const audio = new Audio(gameRef.current?.currentRound.songCard?.songURL);
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
    //const userId = localStorage.getItem("id");
    /*const body = {
      "songCard": songCard,
      "position": placement,
    }*/
    //await apiService.put(`/games/${gameId}/${userId}`, body);
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

  useEffect(()=>{
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
    };
  }


  if (!player || !game?.currentRound?.activePlayer) {
    return <div style={{color: "white"}}>Loading...</div>;
  }

  return (
    <div
      className={"card-container"}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
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
          backgroundColor: "#e5e1ca",
          alignItems: "center",
          paddingTop: "20px",
          width: "700px",
          textAlign: "center",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <Title level={2} style={{ color: "black" }}>
          {game?.gameName || "{gameName}"}
        </Title>
        <div className="playButtonContainer">
        {songCard?.songURL && player.userId == game.currentRound.activePlayer.userId && (
          <div className={`playButton ${isPlaying ? "playing" : ""}`}
               onClick={audioState && !isPlaying ? handlePlayButtonClick : undefined}
               style={{pointerEvents: audioState ? "auto" : "none"}}>
            <img src="/img/playsymbol.png" alt="Play" className="playIcon"/>
          </div>
        )}
        </div>
      <div className="songCardContainer">
        {placement == null && player.userId == game.currentRound.activePlayer.userId && (
          <div className="songCard">
            <Text strong style={{fontSize: "30px"}}>?</Text>
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
                          <Text strong style={{fontSize: "30px"}}>?</Text>
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
                        <Text strong style={{fontSize: "14px", color: "#fefae0"}}>{card.title}</Text>
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
                          <Text strong style={{ fontSize: "30px"}}>?</Text>
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
    </div>
  );
};


export default GamePage;
