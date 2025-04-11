"use client";

import React, {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {useApi} from "@/hooks/useApi";

import {User} from "@/types/user";
import {Lobby} from "@/types/lobby";
import "@ant-design/v5-patch-for-react-19";
import {SearchOutlined} from "@ant-design/icons";
import {Button, Space, Input, TableProps, Table, Card, message} from "antd";

const columns: TableProps<User>["columns"] = [
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
  },
];

const LobbyPage: () => void = () => {
  const router = useRouter();
  const apiService = useApi();
  const params = useParams();
  const lobbyId = params.id;
  const [lobby, setLobby] = useState<Lobby>({} as Lobby);
  const [user, setUser] = useState<User>({} as User);
  const [searchUsername, setSearchUsername] = useState(""); // save input username
  const [hostFriends, setHostFriends] = useState<User[]>([]);

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
              message.success(`Lobby invite sent to ${record.username}`);
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
        const lobbyHost = lobby.host
        console.log(lobbyHost);
        if (lobbyHost && lobbyHost.friends?.length > 0) {
          const friendPromises = lobbyHost.friends.map((id) => apiService.get<User>(`/users/${id}`));
          console.log(friendPromises);
          const friendsOfHost = await Promise.all(friendPromises);
          console.log(friendsOfHost);
          setHostFriends(friendsOfHost);
        }
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

  }, [apiService, router, lobbyId, lobby.host]);

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
  }, [apiService, lobby]);

  return (
    <div className={"card-container"}>
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
      <h2
        style={{
          fontSize: "3rem",
          marginBottom: "50px",
          textAlign: "center",
          color: "lightblue",
        }}
      >
        {lobby.lobbyName}
      </h2>
      <div style={{display: "flex", justifyContent: "space-between", width: "50%"}}>
        <Card
          title="Invite Friends"
          loading={!hostFriends}
          className={"dashboard-container"}
          style={{marginBottom: 50, marginRight: 50}}
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
          style={{marginBottom: 50, width: "50%"}}
        >
          {lobby && (lobby.members?.length > 0) && (
            <>
              <Table<User>
                columns={columns}
                dataSource={lobby.members}
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
      <Button
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
        }}
        onClick={() => {
          router.push(`/game/${lobbyId}`)
        }}
        hidden={localStorage.getItem("id") !== lobby.host?.id}
      >
        Start Game
      </Button>
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          fontSize: "16px",
          color: "lightblue",
        }}
      >
        Hitster by Group 24, SoPra FS25
      </div>
    </div>
  )
}

export default LobbyPage;