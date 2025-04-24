"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useSessionStorage from "@/hooks/useSessionStorage";
import Header from "@/components/header";
import InviteAction from "@/components/InviteAction";
import { User } from "@/types/user";
import { Lobby } from "@/types/lobby";

import "@ant-design/v5-patch-for-react-19";
import { Button, Card, message, Table, TableProps } from "antd";

import { connectWebSocket } from "@/websocket/websocketService";
import { Client } from "@stomp/stompjs";

const columns: TableProps<User>["columns"] = [
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
  },
];

const LobbyPage: () => void = () => {
  const [messageAPI, contextHolder] = message.useMessage();
  const router = useRouter();
  const apiService = useApi();
  const params = useParams();
  const lobbyId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [lobby, setLobby] = useState<Lobby>({} as Lobby);
  const [user, setUser] = useState<User>({} as User);
  const [userFriends, setUserFriends] = useState<User[]>([]);
  const [stompClient, setStompClient] = useState<Client | null>(null);

  const {
    value: id,
  } = useSessionStorage<string>("id", "");

  const friendColumns: TableProps<User>["columns"] = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      render: (text, record) => (
        <a onClick={() => router.push(`/users/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: "Invite",
      key: "action",
      render: (_, record) => (
        <InviteAction user={record} lobby={lobby} messageAPI={messageAPI} />
      ),
    },
  ];

  const handleWebSocketMessage = (message: string) => {
    const parsedMessage = JSON.parse(message);
    console.log("Websocket message handled");
    if (parsedMessage.event_type === "start-game") {
      router.push(`/game/${lobbyId}`);
    }
  };

  // this function is only gonna work for the host. To get all members to game page, websockets are needed (?)
  const startGame = async () => {
    try {
      // Send PUT request for each lobby member, setting status to PLAYING
      const updateStatusPromises = lobby.members.map((member) =>
        apiService.put("/playing", member.id)
      );
      await Promise.all(updateStatusPromises);
      messageAPI.success("Host has started the game");
      await apiService.post("/games", lobbyId);
      console.log("stompClient:", stompClient?.connected);
      if (stompClient?.connected) {
        (stompClient as Client).publish({
          destination: "/app/start",
          body: lobbyId ?? "",
        });
      }
    } catch (error) {
      console.error("Failed to set all users to PLAYING:", error);
      alert("Something went wrong while starting the game.");
    }
  };

  useEffect(() => {
    const fetchLobby = async () => {
      //TODO: check if hook can be used instead
      const StorageId = sessionStorage.getItem("id");
      try {
        //get User data of current logged in user
        const currentUser = await apiService.get<User>(`/users/${StorageId}`);
        setUser(currentUser);

        //get Lobby data
        const currentLobby = await apiService.get<Lobby>(`/lobbies/${lobbyId}`);
        setLobby(currentLobby);
      } catch (error) {
        if (error instanceof Error) {
          alert(
            `Something went wrong while fetching the lobby:\n${error.message}`,
          );
          console.log(error);
        } else {
          console.error("An unknown error occurred while fetching the lobby.");
        }
      }
    };
    fetchLobby();
  }, [apiService, router, lobbyId]);

  // effect to load users friends, trigered as soon as user is set
  useEffect(() => {
    const fetchFriends = async () => {
      if (user && user.friends?.length > 0) {
        try {
          const friendPromises = user.friends.map((id) =>
            apiService.get<User>(`/users/${id}`)
          );
          const friendsOfUser = await Promise.all(friendPromises);
          setUserFriends(friendsOfUser);
        } catch (error) {
          if (error instanceof Error) {
            alert(
              `Something went wrong while fetching the friends:\n${error.message}`,
            );
            console.log(error);
          } else {
            console.error(
              "An unknown error occurred while fetching the friends.",
            );
          }
        }
      }
    };
    fetchFriends();
  }, [user]);

  useEffect(() => {
    console.log("lobbyId:", lobbyId);
    const client = connectWebSocket(handleWebSocketMessage, lobbyId);
    setStompClient(client);

    return () => {
      client?.deactivate();
    };
  }, []);

  return (
    <div className={"card-container"}>
      {contextHolder}
      <Header />
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
        <h2
          style={{
            fontSize: "3rem",
            marginBottom: "50px",
            textAlign: "center",
            color: "#BC6C25",
          }}
        >
          {lobby.lobbyName}
        </h2>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "50%",
          }}
        >
          <Card
            title="Invite Friends"
            loading={!userFriends}
            className={"dashboard-container"}
            style={{ marginBottom: 50, marginRight: 50, width: "100%" }}
          >
            <div style={{display: "flex", justifyContent: "center"}}>
              {userFriends.length > 0
                ? (
                  <Table<User>
                    columns={friendColumns}
                    dataSource={userFriends}
                    rowKey="id"
                    style={{
                      minWidth: "150px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  />
                )
                : <p>User has no friends</p>}
            </div>
          </Card>
          <Card
            title="Players"
            loading={!lobby}
            className={"dashboard-container"}
            style={{ marginBottom: 50, width: "100%" }}
          >
            {lobby && (lobby.members?.length > 0) && (
              <>
                <Table<User>
                  columns={columns}
                  dataSource={lobby.members}
                  style={{
                    minWidth: "150px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  rowKey="id"
                  onRow={(row) => ({
                    onClick: () => router.push(`/users/${row.id}`),
                    style: { cursor: "pointer" },
                  })}
                >
                </Table>
              </>
            )}
          </Card>
        </div>
      </Card>
      {id === lobby.host?.id && (
        <Button
          style={{
            position: "absolute",
            bottom: "75px",
            left: "45%",
          }}
          onClick={startGame}
        >
          Start Game
        </Button>
      )}
    </div>
  );
};

export default LobbyPage;
