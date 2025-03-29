"use client";

import React, {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {useApi} from "@/hooks/useApi";

import {User} from "@/types/user";
import "@ant-design/v5-patch-for-react-19";
import { SearchOutlined } from "@ant-design/icons";
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

  const handleAcceptFriendRequest = async (userId2: string | null): Promise<void> => {
    try {
      const ResponseBody = {
        "userId2": userId2,
        "accepted": true
      }
      const updatedUser: User = await apiService.post<User>(`/users/${id}/friends`, ResponseBody);
      setUser(updatedUser);
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
    } catch (error) {
      console.error("Error declining friend request", error);
    }
  };

  useEffect(() => {
    const StorageId = localStorage.getItem("id");
    if (!StorageId) {
      router.push("/login");
      return;
    }

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
  }, [apiService, id, router, user]);

  return (
    <div>
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
              <Button onClick={() => handleAcceptFriendRequest(friend.id)}>Accept</Button>
              <Button onClick={() => handleDeclineFriendRequest(friend.id)}>Decline</Button>
            </div>
          ))
        ) : (
            <strong>No friend requests</strong>
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
