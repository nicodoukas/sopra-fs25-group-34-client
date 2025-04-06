// this code is part of S2 to display a list of all registered users
// clicking on a user in this list will display /app/users/[id]/page.tsx
"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Lobby } from "@/types/lobby";
import "@ant-design/v5-patch-for-react-19";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Card, Input, Space, Table } from "antd";
import type { TableProps } from "antd"; // antd component library allows imports of types
// Optionally, you can import a CSS module or file for additional styling:
// import "@/styles/views/Dashboard.scss";

// Columns for the antd table of User objects
const columns: TableProps<User>["columns"] = [
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
  },
  {
    title: "Id",
    dataIndex: "id",
    key: "id",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
  },
];

const Dashboard: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [users, setUsers] = useState<User[] | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [searchUsername, setSearchUsername] = useState(""); // save input username
  const [user, setUser] = useState<User>({} as User);
  const [lobbyName, setLobbyName] = useState(""); // save input lobby name
  const [createLobby, setCreateLobby] = useState(false); // check if create lobby button is pushed => show field for lobby name
  const [lobby, setLobby] = useState<Lobby>({} as Lobby);
  // useLocalStorage hook example use
  // The hook returns an object with the value and two functions
  // Simply choose what you need from the hook:
  const {
    // value: token, // is commented out because we dont need to know the token value for logout
    // set: setToken, // is commented out because we dont need to set or update the token value
    clear: clearToken, // all we need in this scenario is a method to clear the token
  } = useLocalStorage<string>("token", ""); // if you wanted to select a different token, i.e "lobby", useLocalStorage<string>("lobby", "");

  const handleLogout = async (): Promise<void> => {
    const id = localStorage.getItem("id");

    if (!id) {
      console.error("No user ID found (localStorage)");
      return;
    }
    console.log("user with id ", id, "is about to logout");

    try {
      await apiService.put("/logout", id);
      console.log("logout successful for user with id: ", id);
    } catch (error) {
      console.error("Logout failed:", error);
    }

    // Clear token using the returned function 'clear' from the hook
    clearToken();

    localStorage.removeItem("id");

    router.push("/login");
  };

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

  const handleCreateLobby = async (): Promise<void> => {
    if (lobbyName == ""){
      alert("Enter a Name for your lobby.");
      return
    }
    try {
      const RequestBody = {host: user, lobbyName: lobbyName}
      const currentLobby = await apiService.post<Lobby>(`/lobbies`, RequestBody);
      setLobby(currentLobby);
    }
    catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong while creating the lobby:\n${error.message}`);
      } else {
        console.error("An unknown error occurred while creating the lobby.");
      }
    }
  }

  useEffect(() => {
    if (lobby.lobbyId){
      router.push(`/lobby/${lobby.lobbyId}`);
    }
  }, [lobby, router]);

  useEffect(() => {
    const id = localStorage.getItem("id");
    if (!id) {
      router.push("/login");
      return;
    }

    const fetchUsers = async () => {
      try {
        // apiService.get<User[]> returns the parsed JSON object directly,
        // thus we can simply assign it to our users variable.
        const users: User[] = await apiService.get<User[]>("/users");
        setUsers(users);
        const currentUser = users.find((user) => String(user.id) === id);
        if (currentUser) {
          setUsername(currentUser.username);
          setUser(currentUser);
        }
        console.log("Fetched users:", users);
      } catch (error) {
        if (error instanceof Error) {
          alert(`Something went wrong while fetching users:\n${error.message}`);
        } else {
          console.error("An unknown error occurred while fetching users.");
        }
      }
    };

    fetchUsers();
  }, [apiService, router]); // dependency apiService does not re-trigger the useEffect on every render because the hook uses memoization (check useApi.tsx in the hooks).
  // if the dependency array is left empty, the useEffect will trigger exactly once
  // if the dependency array is left away, the useEffect will run on every state change. Since we do a state change to users in the useEffect, this results in an infinite loop.
  // read more here: https://react.dev/reference/react/useEffect#specifying-reactive-dependencies

  return (
    <div className="card-container">
      <Space style={{ position: "absolute", top: 20, left: 20, zIndex: 10 }}>
        <Input
          placeholder="Search for a user..."
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          style={{ height: "40px", fontSize: "16px" }}
        />
        <Button onClick={handleSearch} icon={<SearchOutlined />} />
      </Space>
      <Button
        onClick={() => router.push(`/users/${localStorage.getItem("id")}`)}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
        }}
      >
        {`My Profile (${username})`}
      </Button>
      <h2
        style={{
          fontSize: "3rem",
          marginBottom: "50px",
          textAlign: "center",
          color: "lightblue",
        }}
      >
        Welcome to Hitster!
      </h2>
      {!createLobby ? (
      <>
        <Card
          title="Overview of registered users"
          loading={!users}
          className="dashboard-container"
          style={{ marginBottom: "20px" }}
        >
        {users && (
          <>
            {/* antd Table: pass the columns and data, plus a rowKey for stable row identity */}
            <Table<User>
              columns={columns}
              dataSource={users}
              rowKey="id"
              onRow={(row) => ({
                onClick: () => router.push(`/users/${row.id}`),
                style: { cursor: "pointer" },
              })}
            />
            <Button onClick={handleLogout} type="primary">
              Logout
            </Button>
          </>
          )}
        </Card>
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            onClick={() =>
            router.push(`/users/${localStorage.getItem("id")}/friends`)}
            style={{ marginRight: "10px" }}
          >
            My Friend List
          </Button>
          <Button onClick={() => setCreateLobby(true)} style={{marginRight: "10px"}}>
            Create a new Lobby
          </Button>
          <Button
            onClick={() =>
              router.push(
              `/users/${localStorage.getItem("id")}/friends-lobby-requests`,
            )}
          >
            Friends & Lobby requests
          </Button>
        </div>
        </>) : (
      <>
        <Card style={{marginBottom: "20px", width:400, height:200}}>
          <Input
            placeholder="enter lobby name"
            value={lobbyName}
            onChange={(e) => setLobbyName(e.target.value)}
            style={{height: "40px", fontSize: "16px", marginBottom:50}}
          />
          <div style={{display:"flex", justifyContent:"space-between"}}>
            <Button onClick={() => setCreateLobby(false)}>
              Go Back
            </Button>
            <Button onClick={handleCreateLobby}>
              Create Lobby
            </Button>
          </div>
        </Card>
      </>
      )}
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
  );
};

export default Dashboard;
