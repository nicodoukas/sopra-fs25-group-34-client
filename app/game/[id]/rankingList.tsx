import React, { useEffect, useState } from "react";

import { Player } from "@/types/player";

import { Table, TableProps } from "antd";

interface Props {
  players: Player[];
  playerId: string | null;
}

const RankingList: React.FC<Props> = ({ players, playerId }) => {
  const [sortedPlayersWithRank, setSortedPlayersWithRank] = useState<Player[]>(
    [],
  );
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
      render: (text, record) => (
        <div style={{ display: "flex", flexDirection: "row" }}>
          <div
            className="profile-picture"
            style={{
              width: 30,
              height: 30,
              marginRight: "15px",
              position: "relative",
            }}
          >
            <img src={record.profilePicture?.url} alt="profile picture" />
          </div>
          <span
            style={{
              color: record.userId === playerId ? "orange" : "inherit",
              fontWeight: record.userId === playerId ? "bold" : "normal",
            }}
          >
            {text}
          </span>
        </div>
      ),
    },
    {
      title: "#Cards",
      dataIndex: "cards",
      key: "cards",
    },
    {
      title: "#Coins",
      dataIndex: "coins",
      key: "coins",
    },
  ];

  useEffect(() => {
    const sortedPlayers = players
      .map((player, index) => ({
        ...player,
        rank: index + 1,
        cards: player.timeline.length,
        coins: player.coinBalance,
      }))
      .sort((a, b) => b.cards - a.cards);

    let currentRank = 1;
    const withRank = sortedPlayers.map((player, index, array) => {
      if (index > 0 && player.cards === array[index - 1].cards) {
        player.rank = array[index - 1].rank;
      } else {
        player.rank = currentRank;
        currentRank += 1;
      }
      return player;
    });
    setSortedPlayersWithRank(withRank);
  }, [players]);

  return (
    <div className="light-beige-card">
      <div style={{ overflowY: "auto", maxHeight: "38vh" }}>
        <Table
          dataSource={sortedPlayersWithRank}
          columns={columns}
          rowKey="userId"
          size="middle"
          pagination={false}
        />
      </div>
    </div>
  );
};

export default RankingList;
