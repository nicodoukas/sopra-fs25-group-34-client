"use client";

import React, {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {useApi} from "@/hooks/useApi";

import {User} from "@/types/user";
import {Lobby} from "@/types/lobby";
import "@ant-design/v5-patch-for-react-19";
import {SearchOutlined} from "@ant-design/icons";
import {Button, Space, Input, TableProps, Table, Card, message} from "antd";
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
  const [messageAPI, contextHolder] = message.useMessage()
  const router = useRouter();
  const apiService = useApi();
  const params = useParams();
  const lobbyId = Array.isArray(params.id) ? params.id[0] : params.id;;
  const [lobby, setLobby] = useState<Lobby>({} as Lobby);
  const [user, setUser] = useState<User>({} as User);
  const [searchUsername, setSearchUsername] = useState(""); // save input username
  const [hostFriends, setHostFriends] = useState<User[]>([]);
  const [stompClient, setStompClient] = useState<Client | null>(null);

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
        <Button
          type="primary"
          onClick={async () => {
            try {
              await apiService.post(`/lobbies/invite/${record.id}`, lobby.lobbyId);
              messageAPI.success(`Lobby invite sent to ${record.username}`);
            } catch (error) {
              alert(`Failed to invite ${record.username}.`);
              console.error("Invite error:", error);
            }
          }}
        >
          Invite to Lobby
        </Button>
      ),
    },
  ];

  const handleSearch = async (): Promise<void> => {
    if (!searchUsername.trim()) {
      alert("Enter a username to search for.");
      return;
    }
    try {
      const user: User = await apiService.get<User>(
        `/usersByUsername/${searchUsername}`,
      );
      console.log("user: ", user);
      console.log("userId: ", user.id);
      if (user && user.id) {
        router.push(`/users/${user.id}`);
      } else {
        alert(`No user with username ${searchUsername} exists.`);
      }
    } catch {
      alert(`No user with username ${searchUsername} exists.`);
    }
  };

  const handleWebSocketMessage = (message: string) => {
    const parsedMessage = JSON.parse(message);
    console.log("Websocket message handled")
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
      const StorageId = localStorage.getItem("id");
      try {
        //get User data of current logged in user
        const currentUser = await apiService.get<User>(`/users/${StorageId}`);
        setUser(currentUser)

        //get Lobby data
        const currentLobby = await apiService.get<Lobby>(`/lobbies/${lobbyId}`);
        setLobby(currentLobby);

        //get the friends of lobby Host as User objects, store them in list HostFriends
        // const lobbyHost = lobby.host
        // console.log(lobbyHost);
        // if (lobbyHost && lobbyHost.friends?.length > 0) {
        //   const friendPromises = lobbyHost.friends.map((id) => apiService.get<User>(`/users/${id}`));
        //   console.log(friendPromises);
        //   const friendsOfHost = await Promise.all(friendPromises);
        //   console.log(friendsOfHost);
        //   setHostFriends(friendsOfHost);
        // }
      }
      catch (error) {
        if (error instanceof Error) {
          alert(
            `Something went wrong while fetching the lobby:\n${error.message}`,
          );
          console.log(error);
        } else {
          console.error("An unknown error occurred while fetching the lobby.");
        }
      }
    }
    fetchLobby();

  }, [apiService, router, lobbyId]);

  useEffect(() => {
    //get the friends of lobby Host as User objects, store them in list HostFriends
    const fetchHostFriends = async () => {
      const lobbyHost = lobby.host
      console.log(lobbyHost);
      if (lobbyHost && lobbyHost.friends?.length > 0) {
        try {
          const friendPromises = lobbyHost.friends.map((id) => apiService.get<User>(`/users/${id}`));
          console.log(friendPromises);
          const friendsOfHost = await Promise.all(friendPromises);
          console.log(friendsOfHost);
          setHostFriends(friendsOfHost);
        } catch (error) {
          console.error("Failed to fetch host's friends:", error);
        }
      } else {
        setHostFriends([]);
      }
    };

    fetchHostFriends();
  }, [apiService, lobby.host]);

  useEffect(()=>{
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
      <Space style={{position: "absolute", top: 20, left: 20, zIndex: 10}}>
        <Input
          placeholder="Search for a user..."
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          style={{height: "40px", fontSize: "16px"}}
        />
        <Button onClick={handleSearch} icon={<SearchOutlined/>}/>
      </Space>
      <Button
        onClick={() => router.push(`/users/${localStorage.getItem("id")}`)}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
        }}
      >
        {`My Profile (${user.username})`}
      </Button>
      <Card style={{
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
      }}>
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
      <div style={{display: "flex", justifyContent: "space-between", width: "50%"}}>
        <Card
          title="Invite Friends"
          loading={!hostFriends}
          className={"dashboard-container"}
          style={{marginBottom: 50, marginRight: 50, minWidth: "200px"}}
        >
          {hostFriends.length > 0 ? (
            <Table<User>
              columns={friendColumns}
              dataSource={hostFriends}
              rowKey="id"
            />
          ) : (
            <p>Host has no friends</p>
          )}
        </Card>
        <Card
          title="Players"
          loading={!lobby}
          className={"dashboard-container"}
          style={{marginBottom: 50, width: "100%"}}
        >
          {lobby && (lobby.members?.length > 0) && (
            <>
              <Table<User>
                columns={columns}
                dataSource={lobby.members}
                style={{minWidth: "150px", display: "flex",
                  justifyContent: "center",
                  alignItems: "center"}}
                rowKey="id"
                onRow={(row) => ({
                  onClick: () => router.push(`/users/${row.id}`),
                  style: {cursor: "pointer"},
                })}
              >
              </Table>
            </>
          )}
        </Card>
      </div>
      </Card>
      <Button
        style={{
          position: "absolute",
          bottom: "75px",
          left: "45%",
        }}
        onClick={startGame}
        hidden={localStorage.getItem("id") !== lobby.host?.id}
      >
        Start Game
      </Button>
    </div>
  )
}

export default LobbyPage;