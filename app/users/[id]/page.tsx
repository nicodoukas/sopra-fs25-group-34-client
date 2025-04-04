"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import "@ant-design/v5-patch-for-react-19";
import { Button, Card } from "antd";

const UserProfile: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const params = useParams();
  const id = params.id;
  console.log("userid:", id);

  const [user, setUser] = useState<User>({} as User);

  const handleGoBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/users/${id}/edit`);
  };

  const handleRemoveFriend = async () => {
    const StorageId = localStorage.getItem("id");
    await apiService.delete(`/users/${StorageId}/friends/${id}`);
    router.back();
  };

  const handleAddFriend = async () => {
    const loggedInUserId = localStorage.getItem("id");
    await apiService.post(`/users/${loggedInUserId}/friendrequests`, id);
    router.back();
  };

  useEffect(() => {
    const StorageId = localStorage.getItem("id");
    if (!StorageId) {
      router.push("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        const user: User = await apiService.get<User>(`/users/${id}`);
        setUser(user);
        console.log("Fetched user:", user);
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

  if (localStorage.getItem("id") === id) {
    return (
      <div
        className="card-container"
        style={{display: "flex", justifyContent: "center"}}
      >
        <Card title={user.username} variant="outlined" style={{width: 350}}>
          <p>
            <strong>Username:</strong> {user.username}
          </p>
          <p>
            <strong>Birthday:</strong> {user.birthday ? String(user.birthday).split('T')[0] : "N/A"}
          </p>
          <p>
            <strong>Creationdate:</strong> {user.creation_date ? String(user.creation_date).split('T')[0] : "N/A"}
          </p>
          <p>
            <strong>Status:</strong> {user.status}
          </p>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 16,
            }}
          >
            <Button type="primary" onClick={handleGoBack}>Go Back</Button>
            <Button type="primary" onClick={handleEdit}>Edit</Button>
          </div>
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
    );
  }
  return (
    <div
      className="card-container"
      style={{display: "flex", justifyContent: "center"}}
      >
        <Card title={user.username} variant="outlined" style={{width: 350}}>
          <p>
          <strong>Username:</strong> {user.username}
        </p>
        <p>
          <strong>Birthday:</strong> {user.birthday ? String(user.birthday).split('T')[0] : "N/A"}
        </p>
        <p>
          <strong>Creationdate:</strong> {user.creation_date ? String(user.creation_date).split('T')[0] : "N/A"}
        </p>
        <p>
          <strong>Status:</strong> {user.status}
        </p>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            justifyContent: "space-between",
          }}
        >
          <Button type="primary" onClick={handleGoBack}>Go Back</Button>
          {
            //Check if the current user's ID is in the friends list of the user of this profile
            (user.friends?.includes(Number(localStorage.getItem("id"))))
              ? (
                <Button type="primary" onClick={handleRemoveFriend}>
                  Remove Friend
                </Button>
              )
              : (user.friendrequests?.includes(
                  Number(localStorage.getItem("id")),
              ))
                ? <p>pending friendrequest...</p>
                : (
                  <Button type="primary" onClick={handleAddFriend}>
                    Add Friend
                  </Button>
                )
          }
        </div>
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
  );
};

export default UserProfile;
