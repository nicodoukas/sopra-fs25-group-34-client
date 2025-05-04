"use client";

import {Card, Table, TableProps} from "antd";
import React, {useEffect, useState} from "react";
import {useApi} from "@/hooks/useApi";
import {Game} from "@/types/game";
import {Player} from "@/types/player";
import {useParams} from "next/navigation";

const columns: TableProps["columns"] = [
  {
    title: "Rank",
    dataIndex: "rank",
    key: "rank",
  },
  {
    title: "Player",
    dataIndex: "username",
    key: "username",
  },
  {
    title: "#Cards",
    dataIndex: "cards",
    key: "cards",
  },
];
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

        const userId = sessionStorage.getItem("id");
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

  const sortedPlayers = game.players
    .map((player, index) => ({
      ...player,
      rank: index + 1,
      cards: player.timeline.length,
    }))
    .sort((a, b) => b.cards - a.cards);

  let currentRank = 1;
  const sortedPlayersWithRank = sortedPlayers.map((player,index, array) => {
    if (index > 0 && player.cards === array[index -1].cards) {
      player.rank = array[index - 1].rank;
    }
    else {
      player.rank = currentRank;
      currentRank += 1;
    }
    return player;
  });

  const playerRank = sortedPlayersWithRank.find((p) => p.userId === player.userId)?.rank;

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
        {playerRank === 1 ? (
          <div>
            Congratulations {player.username}, you won this game!
          </div>
        ) : (
          <div>
            Sorry, you did not win this game.
          </div>
        )}
        <h2 style={{fontSize: "30px", marginTop:"20px"}}>Final Rankings</h2>
        <Table
          dataSource={sortedPlayersWithRank}
          columns={columns}
          rowKey="userId"
        />
      </Card>

    </div>
  );
};
export default EndScreen;