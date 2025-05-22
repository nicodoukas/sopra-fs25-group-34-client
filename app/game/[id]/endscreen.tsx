"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useApi } from "@/hooks/useApi";
import { Game } from "@/types/game";
import { Player } from "@/types/player";
import RankingList from "./rankingList";
import Firework from "./fireworks";

import { Button, Card, message } from "antd";

import { connectWebSocket } from "@/websocket/websocketService";
import { Client } from "@stomp/stompjs";

const EndScreen = () => {
  const [game, setGame] = useState<Game>({} as Game);
  const apiService = useApi();
  const router = useRouter();
  const params = useParams();
  const gameId = Array.isArray(params.id) ? params.id[0] : params.id!;
  const [player, setPlayer] = useState<Player>({} as Player);
  const [stompClient, setStompClient] = useState<Client | null>(null);

  const handleWebSocketMessage = (message: string) => {
    const parsedMessage = JSON.parse(message);
    if (parsedMessage.event_type === "back-to-lobby") {
      router.push(`/lobby/${gameId}`);
    }
  };

  const deleteGame = async () => {
    try {
      await apiService.delete(`/games/${gameId}/${player.userId}`);
      if (stompClient?.connected) {
        (stompClient as Client).publish({
          destination: "/app/backToLobby",
          body: gameId ?? "",
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(`Error: ${error.message}`);
      } else {
        message.error("Unknown error while deleting game.");
      }
      console.error(error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gameData = await apiService.get<Game>(`/games/${gameId}`);
        setGame(gameData);
        const userId = sessionStorage.getItem("id");
        const playerData = await apiService.get<Player>(
          `/games/${gameId}/${userId}`,
        );
        setPlayer(playerData);
      } catch (error) {
        message.error("Failed to fetch game or player data.");
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [apiService, gameId]);

  useEffect(() => {
    const client = connectWebSocket(handleWebSocketMessage, gameId);
    setStompClient(client);

    return () => {
      client?.deactivate();
    };
  }, []);

  if (!player?.timeline || !game) {
    return <div style={{ color: "white" }}>Loading...</div>;
  }

  const sortedPlayers = game.players
    .map((player, index) => ({
      ...player,
      rank: index + 1,
      cards: player.timeline.length,
    }))
    .sort((a, b) => b.cards - a.cards);

  let currentRank = 1;
  const sortedPlayersWithRank = sortedPlayers.map((player, index, array) => {
    if (index > 0 && player.cards === array[index - 1].cards) {
      player.rank = array[index - 1].rank;
    } else {
      player.rank = currentRank;
      currentRank += 1;
    }
    return player;
  });

  const playerRank = sortedPlayersWithRank.find((p) =>
    p.userId === player.userId
  )?.rank;

  return (
    <>
      {playerRank === 1 && <Firework></Firework>}
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "black",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Card
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#e5e1ca",
            alignItems: "center",
            textAlign: "center",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            width: "500px",
          }}
        >
          <h1>Game Over!</h1>
          <p>Thanks for playing</p>
          {playerRank === 1
            ? (
              <div>
                Congratulations {player.username}, you won this game!
              </div>
            )
            : (
              <div>
                Sorry, you did not win this game.
              </div>
            )}
          <h2
            style={{
              fontSize: "30px",
              marginTop: "20px",
              marginBottom: "15px",
            }}
          >
            Final Rankings
          </h2>
          <RankingList players={game.players} playerId={player.userId} />
          {player.userId === game.host?.userId && (
            <Button onClick={deleteGame} style={{ marginTop: "10px" }}>
              Back to Lobby
            </Button>
          )}
        </Card>
      </div>
    </>
  );
};
export default EndScreen;
