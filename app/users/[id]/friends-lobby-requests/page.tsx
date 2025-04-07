"use client";

import React, {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {useApi} from "@/hooks/useApi";

import {User} from "@/types/user";
import {Lobby} from "@/types/lobby";
import "@ant-design/v5-patch-for-react-19";
import { SearchOutlined } from "@ant-design/icons";
import {Button, Space, Input, message} from "antd";


const FriendsLobbyRequest: React.FC = () => {
  const [messageAPI, contextHolder] = message.useMessage();
  const router = useRouter();
  const apiService = useApi();
  const params = useParams();
  const id = params.id;

  const [user, setUser] = useState<User>({} as User);
  const [searchUsername, setSearchUsername] = useState("");
  const [friendrequests, setFriendrequests] = useState<User[]>([]);
  const [lobbyInvites, setLobbyInvites] = useState<Lobby[]>([]);

  const handleSearch = async (): Promise<void> => {
    if (!searchUsername.trim()) {
      alert("Enter a username to search for.");
      return;
    }
    try {
      const user: User = await apiService.get<User>(`/usersByUsername/${searchUsername}`);
      console.log("user: ", user);
      console.log("userId: ", user.id)
      if (user && user.id) {
        router.push(`/users/${user.id}`);
      } else {
        alert(`No user with username ${searchUsername} exists.`);
      }
    } catch {
      alert(`No user with username ${searchUsername} exists.`);
    }
  };

  const handleAcceptFriendRequest = async (userId2: string | null): Promise<void> => {
    try {
      const ResponseBody = {
        "userId2": userId2,
        "accepted": true
      }
      const updatedUser: User = await apiService.post<User>(`/users/${id}/friends`, ResponseBody);
      setUser(updatedUser);
      messageAPI.success(`Friend request accepted`);
    }
    catch (error) {
      console.error("Error accepting friend request", error);
    }
  };

  const handleDeclineFriendRequest = async (userId2: string | null): Promise<void> => {
    try {
      const ResponseBody = {
        "userId2": userId2,
        "accepted": false
      }
      const updatedUser: User = await apiService.post<User>(`/users/${id}/friends`, ResponseBody);
      setUser(updatedUser);
      messageAPI.success(`Friend request declined`);
    } catch (error) {
      console.error("Error declining friend request", error);
    }
  };

  const handleAcceptLobbyInvite = async (lobbyId: string | null): Promise<void> =>{
    try {
      const ResponseBody = {
        "userId": user.id,
        "accepted": true
      }
      await apiService.post<Lobby>(`/lobbies/${lobbyId}/users`, ResponseBody);
      messageAPI.success("Lobby invite accepted")
    } catch (error) {
      console.error("Error accepting lobby invite", error);
    }
  }

  const handleDeclineLobbyInvite = async (lobbyId: string | null): Promise<void> =>{
    try {
      const ResponseBody = {
        "userId": user.id,
        "accepted": false
      }
      await apiService.post<Lobby>(`/lobbies/${lobbyId}/users`, ResponseBody);
      const currentUser = await apiService.get<User>(`/users/${user.id}`);
      setUser(currentUser);

      messageAPI.success("Lobby invite declined")
    } catch (error) {
      console.error("Error accepting lobby invite", error);
    }
  }

  useEffect(() => {
    const StorageId = localStorage.getItem("id");
    if (!StorageId || StorageId != id) {
      router.push("/users");
      return;
    }

    const fetchUser = async () => {
      try {
        const currentUser = await apiService.get<User>(`/users/${id}`);
        setUser(currentUser);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, [apiService, id, router]);

  useEffect(() => {
    if (!user.id) return;

    const fetchFriendRequestsAndLobbies = async () => {
      try {
        // Fetch all users with id inside the user.friendrequests list
        const friendrequestDetails :User[] = await Promise.all(user.friendrequests.map((id) => apiService.get<User>(`/users/${id}`)));
        setFriendrequests(friendrequestDetails)

        // Fetch lobby invites
        const lobbyInvitePromises = user.openLobbyInvitations.map((lobbyId) =>
            apiService.get<Lobby> (`/lobbies/${lobbyId}`)
        );
        const lobbyInvitesTemp: Lobby[] = await Promise.all(lobbyInvitePromises);
        setLobbyInvites(lobbyInvitesTemp);
      } catch (error) {
        console.error("Error fetching friend requests or lobbies:", error);
      }
    };

    fetchFriendRequestsAndLobbies();
  }, [user]);

  return (
    <div>
      {contextHolder}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: 20,
          marginRight: 50,
        }}>
        <Space style={{position: "absolute", top: 20, left: 20, zIndex: 10}}>
          <Input
            placeholder="Search for a user..."
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            style={{height: "40px", fontSize: "16px"}}
          />
          <Button onClick={handleSearch} icon={<SearchOutlined/>}/>
        </Space>
        <div onClick={() => router.push(`/users/${user.id}`)} style={{color: "white", cursor: "pointer"}}>
          {`${user.username}`}
        </div>
      </div>
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "space-around", alignItems: "center"
      }}>
        <strong style={{marginBottom: 40}}>Your friend requests and lobby invites</strong>
        {friendrequests.length > 0 ? (
          friendrequests.map((friend) => (
            <div key={friend.id}>
              <strong onClick={() => router.push(`/users/${friend.id}`)} style={{cursor: "pointer"}}>
                {friend.username} wants to be your friend
              </strong>
              <Button type="primary" style={{marginLeft: 10}}
                onClick={() => handleAcceptFriendRequest(friend.id)}>
                Accept
              </Button>
              <Button style={{marginLeft: 5}} onClick={() => handleDeclineFriendRequest(friend.id)}>Decline</Button>
            </div>
          ))
        ) : (
          <strong>No friend requests</strong>
        )}
      </div>
      <div style={{marginTop: 40, display: "flex", flexDirection: "column", justifyContent: "space-around", alignItems: "center"}}>
        {lobbyInvites.length > 0 ? (
          lobbyInvites.map((lobby) => (
            <div key={lobby.lobbyId}>
              <strong onClick={() => router.push(`/users`)} style={{cursor: "pointer"}}>
                You have been invited to lobby: {lobby.lobbyName}
              </strong>
              <Button type="primary" style={{marginLeft: 10}}
                onClick = {() => handleAcceptLobbyInvite(lobby.lobbyId)}>
                Accept
              </Button>
              <Button style={{marginLeft: 5}}
                onClick = {() => handleDeclineLobbyInvite(lobby.lobbyId)}>
                Decline
              </Button>
            </div>
          ))
        ) : (
          <strong>No lobby invitations</strong>
        )}
      </div>
      <div style={{position: "fixed", bottom: 100, left: 100}}>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
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

export default FriendsLobbyRequest;
