"use client";

import {Card} from "antd";
import React, {useEffect, useState} from "react";
import {useApi} from "@/hooks/useApi";
import {Game} from "@/types/game";
import {Player} from "@/types/player";
import {useParams} from "next/navigation";

const EndScreen = () => {
  const [game, setGame] = useState<Game>({} as Game);
  const apiService = useApi();
  const params = useParams();
  const gameId = Array.isArray(params.id) ? params.id[0] : params.id!;
  const [player, setPlayer] = useState<Player>({} as Player);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gameData = await apiService.get<Game>(`/games/${gameId}`);
        setGame(gameData);
        console.log("This is the game: ", gameData);

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

  if (!player?.timeline || !game) {
    return <div style={{color: "white"}}>Loading...</div>;
  }

  return (
    <div
      style={{
        padding: 40,
        textAlign: "center",
        color: "black",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
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
          width: "500px",
        }}
      >
        <h1>Game Over!</h1>
        <p>Thanks for playing</p>
        {player.timeline.length == 10 ? (
          <div>
            You won! Congratulation
          </div>
        ) : (
          <div>
            You lose
          </div>
        )}
      </Card>

    </div>
  );
};
export default EndScreen;