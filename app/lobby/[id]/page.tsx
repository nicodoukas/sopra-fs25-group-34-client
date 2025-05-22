"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useApi } from "@/hooks/useApi";
import useSessionStorage from "@/hooks/useSessionStorage";
import { User } from "@/types/user";
import { Lobby } from "@/types/lobby";
import withAuth from "@/utils/withAuth";
import Header from "@/components/header";
import InviteAction from "@/components/InviteAction";

import "@ant-design/v5-patch-for-react-19";
import { Button, message, Table, TableProps } from "antd";

import { connectWebSocket } from "@/websocket/websocketService";
import { Client } from "@stomp/stompjs";

const columns: TableProps<User>["columns"] = [
  {
    title: "Username",
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
        <span>{text}</span>
      </div>
    ),
  },
];

const LobbyPage: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const params = useParams();
  const lobbyId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [lobby, setLobby] = useState<Lobby>({} as Lobby);
  const [user, setUser] = useState<User>({} as User);
  const [userFriends, setUserFriends] = useState<User[]>([]);
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [isLobbyMemeber, setIsLobbyMember] = useState<boolean | null>(null);
  const hasHandledMissingLobby = useRef(false);

  const {
    value: id,
  } = useSessionStorage<string>("id", "");

  const friendColumns: TableProps<User>["columns"] = [
    {
      title: "Username",
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
          <a
            onClick={() =>
              router.push(`/users/${record.id}`)}
          >
            {text}
          </a>
        </div>
      ),
    },
    {
      title: "Invite",
      key: "action",
      render: (_, record) => <InviteAction user={record} lobby={lobby} />,
    },
  ];

  const handleWebSocketMessage = async (websocket_message: string) => {
    const parsedMessage = JSON.parse(websocket_message);
    if (parsedMessage.event_type === "start-game") {
      router.push(`/game/${lobbyId}`);
    }
    if (parsedMessage.event_type === "delete-lobby") {
      setTimeout(() => {
        message.info("The lobby was deleted by the host.");
      }, 200);
      router.push("/overview");
    }
    if (parsedMessage.event_type === "update-lobby") {
      await fetchLobby();
    }
  };

  const startGame = async () => {
    try {
      // Send PUT request for each lobby member, setting status to PLAYING
      const updateStatusPromises = lobby.members.map((member) =>
        apiService.put("/playing", member.id)
      );
      await Promise.all(updateStatusPromises);
      message.success("Host has started the game");
      await apiService.post("/games", lobbyId);
      if (stompClient?.connected) {
        (stompClient as Client).publish({
          destination: "/app/start",
          body: lobbyId ?? "",
        });
      }
    } catch (error) {
      console.error("Failed to set all users to PLAYING:", error);
      message.error("Something went wrong while starting the game.");
    }
  };

  const deleteLobby = async () => {
    try {
      //Delete Lobby / leave Lobby
      if (id === lobby.host?.id) {
        await apiService.delete(`/lobbies/${lobbyId}/${id}`);

        //websocket for deleting lobby
        if (stompClient?.connected) {
          (stompClient as Client).publish({
            destination: "/app/delete",
            body: lobbyId ?? "",
          });
        }
      } else {
        await apiService.delete(`/lobbies/${lobbyId}/${id}`);

        //websocket for updating users in lobby
        if (stompClient?.connected) {
          (stompClient as Client).publish({
            destination: "/app/updatelobby",
            body: lobbyId ?? "",
          });
        }
        //user is now navigated back to overview
        router.push("/overview");
      }
    } catch (error) {
      message.error("Something went wrong while deleting/leaving the lobby.");
      console.error(error);
    }
  };

  const fetchLobby = async () => {
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
        if (error.message.includes("404: Lobby with ID")) {
          if (!hasHandledMissingLobby.current) {
            hasHandledMissingLobby.current = true;
            setTimeout(() => {
              message.warning(
                "There exists no lobby with this id, please create one.",
              );
            }, 200);
            router.push("/overview");
          }
        } else {
          message.error(
            `Something went wrong while loading the lobby:\n${error.message}`,
          );
        }
      } else {
        message.error("An unknown error occurred while loading the lobby.");
      }
      console.error(error);
    }
  };

  useEffect(() => {
    if (!lobby.members || !id) return;
    if (isLobbyMemeber != null) return;
    if (lobby.members.some((member) => member.id === id)) {
      setIsLobbyMember(true);
    } else {
      setTimeout(() => {
        message.info("This page is only accessible to members of the lobby");
      }, 200);
      setIsLobbyMember(false);
      router.push("/overview");
    }
  }, [router, lobby, id]);

  useEffect(() => {
    fetchLobby();
  }, [apiService, router, lobbyId]);

  // effect to load users friends, triggered as soon as user is set
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
            message.error(
              `Something went wrong while loading the friends:\n${error.message}`,
            );
          } else {
            message.error(
              "An unknown error occurred while loading the friends.",
            );
          }
          console.error(error);
        }
      }
    };
    fetchFriends();
  }, [user]);

  useEffect(() => {
    const client = connectWebSocket(handleWebSocketMessage, lobbyId);
    setStompClient(client);

    return () => {
      client?.deactivate();
    };
  }, []);

  if (!isLobbyMemeber) {
    return <div>Loading...</div>;
  }

  return (
    <div className={"lobby-page-container"}>
      <Header />
      <div className="beige-card">
        <h2
          style={{
            fontSize: "3rem",
            marginBottom: "20px",
            textAlign: "center",
            color: "#BC6C25",
          }}
        >
          {lobby.lobbyName}
        </h2>
        <div className="side-by-side-card-container">
          <div className="light-beige-card">
            <h3>Invite Friends</h3>
            <div style={{ overflowY: "auto", maxHeight: "48vh" }}>
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
                    size="middle"
                    pagination={false}
                  />
                )
                : <p>User has no friends</p>}
            </div>
          </div>
          <div className="light-beige-card">
            <h3>Players</h3>
            <div style={{ overflowY: "auto", maxHeight: "48vh" }}>
              {lobby && (lobby.members?.length > 0) && (
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
                  size="middle"
                  pagination={false}
                >
                </Table>
              )}
            </div>
          </div>
        </div>
        <div
          className="side-by-side-card-container"
          style={{ marginTop: "15px" }}
        >
          {id === lobby.host?.id
            ? (
              <>
                <Button onClick={startGame}>
                  Start Game
                </Button>
                <Button onClick={deleteLobby}>
                  Delete Lobby
                </Button>
              </>
            )
            : (
              <Button onClick={deleteLobby}>
                Leave Lobby
              </Button>
            )}
        </div>
      </div>
    </div>
  );
};

export default withAuth(LobbyPage);
