"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import Header from "@/components/header";

import "@ant-design/v5-patch-for-react-19";
import { Button, message } from "antd";

import { User } from "@/types/user";
import { Lobby } from "@/types/lobby";

const FriendsLobbyRequest: React.FC = () => {
  const [messageAPI, contextHolder] = message.useMessage();
  const router = useRouter();
  const apiService = useApi();
  const params = useParams();
  const id = params.id;

  const [user, setUser] = useState<User>({} as User);
  const [friendrequests, setFriendrequests] = useState<User[]>([]);
  const [lobbyInvites, setLobbyInvites] = useState<Lobby[]>([]);

  const handleAcceptFriendRequest = async (
    userId2: string | null,
  ): Promise<void> => {
    try {
      const ResponseBody = {
        "userId2": userId2,
        "accepted": true,
      };
      const updatedUser: User = await apiService.post<User>(
        `/users/${id}/friends`,
        ResponseBody,
      );
      setUser(updatedUser);
      messageAPI.success(`Friend request accepted`);
    } catch (error) {
      console.error("Error accepting friend request", error);
    }
  };

  const handleDeclineFriendRequest = async (
    userId2: string | null,
  ): Promise<void> => {
    try {
      const ResponseBody = {
        "userId2": userId2,
        "accepted": false,
      };
      const updatedUser: User = await apiService.post<User>(
        `/users/${id}/friends`,
        ResponseBody,
      );
      setUser(updatedUser);
      messageAPI.success(`Friend request declined`);
    } catch (error) {
      console.error("Error declining friend request", error);
    }
  };

  const handleAcceptLobbyInvite = async (
    lobbyId: string | null,
  ): Promise<void> => {
    try {
      const ResponseBody = {
        "userId": user.id,
        "accepted": true,
      };
      await apiService.post<Lobby>(`/lobbies/${lobbyId}/users`, ResponseBody);
      messageAPI.success("Lobby invite accepted");
      router.push(`/lobby/${lobbyId}`);
    } catch (error) {
      console.error("Error accepting lobby invite", error);
    }
  };

  const handleDeclineLobbyInvite = async (
    lobbyId: string | null,
  ): Promise<void> => {
    try {
      const ResponseBody = {
        "userId": user.id,
        "accepted": false,
      };
      await apiService.post<Lobby>(`/lobbies/${lobbyId}/users`, ResponseBody);
      const currentUser = await apiService.get<User>(`/users/${user.id}`);
      setUser(currentUser);

      messageAPI.success("Lobby invite declined");
    } catch (error) {
      console.error("Error accepting lobby invite", error);
    }
  };

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
        const friendrequestDetails: User[] = await Promise.all(
          user.friendrequests.map((id) => apiService.get<User>(`/users/${id}`)),
        );
        setFriendrequests(friendrequestDetails);

        // Fetch lobby invites
        const lobbyInvitePromises = user.openLobbyInvitations.map((lobbyId) =>
          apiService.get<Lobby>(`/lobbies/${lobbyId}`)
        );
        const lobbyInvitesTemp: Lobby[] = await Promise.all(
          lobbyInvitePromises,
        );
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
      <Header />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        <strong style={{ marginBottom: 40 }}>
          Your friend requests and lobby invites
        </strong>
        {friendrequests.length > 0
          ? (
            friendrequests.map((friend) => (
              <div key={friend.id}>
                <strong
                  onClick={() => router.push(`/users/${friend.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  {friend.username} wants to be your friend
                </strong>
                <Button
                  type="primary"
                  style={{ marginLeft: 10 }}
                  onClick={() => handleAcceptFriendRequest(friend.id)}
                >
                  Accept
                </Button>
                <Button
                  style={{ marginLeft: 5 }}
                  onClick={() => handleDeclineFriendRequest(friend.id)}
                >
                  Decline
                </Button>
              </div>
            ))
          )
          : <strong>No friend requests</strong>}
      </div>
      <div
        style={{
          marginTop: 40,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        {lobbyInvites.length > 0
          ? (
            lobbyInvites.map((lobby) => (
              <div key={lobby.lobbyId}>
                <strong
                  onClick={() => router.push(`/users`)}
                  style={{ cursor: "pointer" }}
                >
                  You have been invited to lobby: {lobby.lobbyName}
                </strong>
                <Button
                  type="primary"
                  style={{ marginLeft: 10 }}
                  onClick={() => handleAcceptLobbyInvite(lobby.lobbyId)}
                >
                  Accept
                </Button>
                <Button
                  style={{ marginLeft: 5 }}
                  onClick={() => handleDeclineLobbyInvite(lobby.lobbyId)}
                >
                  Decline
                </Button>
              </div>
            ))
          )
          : <strong>No lobby invitations</strong>}
      </div>
      <div style={{ position: "fixed", bottom: 100, left: 100 }}>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    </div>
  );
};

export default FriendsLobbyRequest;
