"use client";

import React, {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {useApi} from "@/hooks/useApi";

import {User} from "@/types/user";
import {Lobby} from "@/types/lobby";
import "@ant-design/v5-patch-for-react-19";
import {SearchOutlined} from "@ant-design/icons";
import {Button, Space, Input, TableProps, Table, Card} from "antd";

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
      <div style={{display:"flex", justifyContent:"space-between", width: "30%"}}>
        <Card
          title="Friends"
          className={"dashboard-container"}
          style={{marginBottom: 50}}
        >
        </Card>
        <Card
          title="Players"
          loading={!lobby}
          className={"dashboard-container"}
          style={{marginBottom: 50}}
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
    </div>
  )
}

export default LobbyPage;