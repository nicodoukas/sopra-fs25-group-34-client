"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useApi } from "@/hooks/useApi";
import Header from "@/components/header";
import withAuth from "@/utils/withAuth";
import { User } from "@/types/user";
import { Lobby } from "@/types/lobby";

import { Button, message, Space } from "antd";

const FriendsLobbyRequest: React.FC = () => {
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
      message.success(`Friend request accepted`);
    } catch (error) {
      if (error instanceof Error) {
        message.error(
          `Something went wrong while accepting friend request:\n${error.message}`,
        );
      } else {
        message.error(
          "An unknown error occurred while accepting friend request.",
        );
        console.error(error);
      }
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
      message.success(`Friend request declined`);
    } catch (error) {
      if (error instanceof Error) {
        message.error(
          `Something went wrong while declining friend request:\n${error.message}`,
        );
      } else {
        message.error(
          "An unknown error occurred while declining friend request.",
        );
        console.error(error);
      }
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
      message.success("Lobby invite accepted");
      router.push(`/lobby/${lobbyId}`);
    } catch (error) {
      if (error instanceof Error) {
        message.error(
          `Something went wrong while accepting lobby inivite:\n${error.message}`,
        );
      } else {
        message.error(
          "An unknown error occurred while accepting lobby invite.",
        );
        console.error(error);
      }
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
      //refetch current user so that invite is not shown anymore
      const currentUser = await apiService.get<User>(`/users/${user.id}`);
      setUser(currentUser);
      message.success("Lobby invite declined");
    } catch (error) {
      if (error instanceof Error) {
        message.error(
          `Something went wrong while declining lobby inivite:\n${error.message}`,
        );
      } else {
        message.error(
          "An unknown error occurred while declining lobby invite.",
        );
        console.error(error);
      }
    }
  };

  useEffect(() => {
    const StorageId = sessionStorage.getItem("id");
    if (StorageId != id) {
      router.push("/overview");
      return;
    }

    const fetchUser = async () => {
      try {
        const currentUser = await apiService.get<User>(`/users/${id}`);
        setUser(currentUser);
      } catch (error) {
        if (error instanceof Error) {
          message.error(
            `Something went wrong while loading the user:\n${error.message}`,
          );
        } else {
          message.error("An unknown error occurred while loading the user.");
        }
        console.error(error);
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
        if (error instanceof Error) {
          message.error(
            `Something went wrong while loading friend requests and lobby invites:\n${error.message}`,
          );
        } else {
          message.error(
            "An unknown error occurred while loading friend requests and lobby invites.",
          );
          console.error(error);
        }
      }
    };

    fetchFriendRequestsAndLobbies();
  }, [user]);

  return (
    <div>
      <Header />
      <div className="card-container">
        <h2>Your friend requests and lobby invites</h2>
        <div className="green-card" style={{ maxWidth: "550px" }}>
          {/* This code shows friend requests if any */}
          {friendrequests.length > 0
            ? (
              friendrequests.map((friend) => (
                <div
                  key={friend.id}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <div
                    className="profile-picture"
                    style={{
                      width: 30,
                      height: 30,
                      marginRight: "8px",
                      position: "relative",
                    }}
                  >
                    <img
                      src={friend.profilePicture?.url}
                      alt="profile picture"
                    />
                  </div>
                  <strong
                    onClick={() => router.push(`/users/${friend.id}`)}
                    style={{
                      cursor: "pointer",
                      display: "block",
                      marginRight: "8px",
                    }}
                  >
                    {friend.username} wants to be your friend
                  </strong>
                  <Space style={{ marginTop: 8, marginBottom: 8 }}>
                    <Button
                      type="primary"
                      onClick={() => handleAcceptFriendRequest(friend.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleDeclineFriendRequest(friend.id)}
                    >
                      Decline
                    </Button>
                  </Space>
                </div>
              ))
            )
            : <h3>No friend requests</h3>}

          {/* this code shows lobby invites if any */}
          {lobbyInvites.length > 0
            ? (
              lobbyInvites.map((lobby) => (
                <div key={lobby.lobbyId}>
                  <strong>
                    You have been invited to lobby: {lobby.lobbyName}
                  </strong>
                  <Space style={{ marginTop: 8, marginBottom: 8 }}>
                    <Button
                      type="primary"
                      onClick={() => handleAcceptLobbyInvite(lobby.lobbyId)}
                    >
                      Accept
                    </Button>
                    <Button
                      onClick={() => handleDeclineLobbyInvite(lobby.lobbyId)}
                    >
                      Decline
                    </Button>
                  </Space>
                </div>
              ))
            )
            : <h3>No lobby invitations</h3>}

          <Button style={{ marginTop: 20 }} onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default withAuth(FriendsLobbyRequest);
