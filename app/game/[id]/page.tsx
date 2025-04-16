"use client";

import React, {useEffect, useState} from "react";
import { useRouter, useParams } from "next/navigation";
import {useApi} from "@/hooks/useApi";
import { Button, Typography, Card, List } from "antd";
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gameData = await apiService.get<Game>(`/games/${gameId}`);
        console.log("This is the game: ", game);
        setGame(gameData);
        const userId = localStorage.getItem("id");
        const playerData = await apiService.get<Player>(`/games/${gameId}/${userId}`);
        setPlayer(playerData);
          console.log("This is the player: ", player);
      } catch (error) {
        alert("Failed to fetch game or player data.");
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [apiService, gameId]);


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
          padding: "40px",
          width: "700px",
          textAlign: "center",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <Title level={2} style={{ color: "#1890ff" }}>
          {game?.gameName || "{gameName}"}
        </Title>
        <div className="playButton">
          {game?.currentRound?.songCard?.songURL && (
            <audio controls>
              <source src={game.currentRound.songCard.songURL} type={"audio/mpeg"}/>

            </audio>
          )
          }
        </div>
        <div className="timeline">
          <Title level={4} style={{textAlign: "center"}}>Your Timeline</Title>
          {player?.timeline && player.timeline.length > 0 ? (
            <List
              bordered
              dataSource={player.timeline}
              renderItem={(card: SongCard, index: number) => (
                <List.Item key={index}>
                  <Text strong>{card.year}</Text>
                  <Text type="secondary">{card.title}</Text>
                </List.Item>
              )}
            />
          ) : (
            <Text type="secondary">No songcards in timeline.</Text>
          )}
        </div>
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
