"use client";

import React, {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {useApi} from "@/hooks/useApi";

import {User} from "@/types/user";
import "@ant-design/v5-patch-for-react-19";
import {Button, Space, Input} from "antd";


const FriendsLobbyRequest: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const params = useParams();
  const id = params.id;

  const [user, setUser] = useState<User>({} as User);
  const [searchUsername, setSearchUsername] = useState("");
  const [friendrequests, setFriendrequests] = useState<User[]>([]);

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

  const handleAcceptFriendRequest = async (): Promise<void> => {
    return;
  }

  const handleDeclineFriendRequest = async (): Promise<void> => {
    return;
  }

  useEffect(() => {

    const fetchUser = async () => {
      try {
        const [currentUser, allUsers] = await Promise.all([apiService.get<User>(`/users/${id}`), apiService.get<User[]>(`/users`)]);
        setUser(currentUser);
        console.log("Fetched user:", user);
        console.log("allUsers:", allUsers);

        //Filter Friendrequests out of allUsers
        const friendrequestDetails = allUsers.filter((u) => (currentUser.friendrequests.includes(Number(u.id))));

        setFriendrequests(friendrequestDetails);

      } catch (error) {
        if (error instanceof Error) {
          alert(
            `Something went wrong while fetching the user:\n${error.message}`,
          );
          console.log(error);
        } else {
          console.error("An unknown error occurred while fetching the user.");
        }
      }
    };

    fetchUser();
  }, [apiService, id, router]);

  return (
    <div>
      <div
        style={{display: "flex", justifyContent: "space-between", alignItems: "center", margin: 20, marginRight: 50}}>
        <Space style={{marginBottom: 16}}>
          <Input
            placeholder="Enter username"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}/>
          <Button type="primary" onClick={handleSearch}>
            Search
          </Button>
        </Space>
        <div>
          {user.username}
        </div>
      </div>
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "space-around", alignItems: "center"
      }}>
        <strong style={{marginBottom: 40}}>Your friend requests and lobby invites</strong>
        {friendrequests.length > 0 ? (
          friendrequests.map((friend) => (
            <strong key={friend.id} onClick={() => router.push(`/users/${friend.id}`)} style={{cursor: "pointer"}}>
              {friend.username} wants to be your friend
              <Button onClick={handleAcceptFriendRequest}>Accept</Button>
              <Button onClick={handleDeclineFriendRequest}>Decline</Button>
            </strong>
          ))
        ) : (
          <strong>No friend requests</strong>
        )}
      </div>
    </div>

  )

};

export default FriendsLobbyRequest;
