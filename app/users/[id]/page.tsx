"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import Header from "@/components/header";

import "@ant-design/v5-patch-for-react-19";
import { Button, message, Space } from "antd";

const UserProfile: React.FC = () => {
  const [messageAPI, contextHolder] = message.useMessage();
  const router = useRouter();
  const apiService = useApi();
  const params = useParams();
  const diplayedUsersId = params.id;

  const [displayedUser, setDisplayedUser] = useState<User>({} as User);

  const {
    clear: clearToken,
  } = useLocalStorage<string>("token", "");

  const {
    value: loggedInUsersId,
    clear: clearId,
  } = useLocalStorage<string>("id", "");

  const handleLogout = async (): Promise<void> => {
    try {
      await apiService.put("/logout", loggedInUsersId);
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the log out:\n${error.message}`);
        console.error(error);
      } else {
        console.error("An unknown error occurred during logout.");
      }
    }

    clearToken();
    clearId();

    router.push("/");
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleEdit = () => {
    router.push(`/users/${loggedInUsersId}/edit`);
  };

  const handleRemoveFriend = async () => {
    try {
      await apiService.delete(
        `/users/${loggedInUsersId}/friends/${diplayedUsersId}`,
      );
      messageAPI.success(`${displayedUser.username} removed from friend list`);

      const updatedUser: User = await apiService.get<User>(
        `/users/${diplayedUsersId}`,
      );
      setDisplayedUser(updatedUser);
    } catch (error) {
      if (error instanceof Error) {
        messageAPI.error("Failed to remove friend.");
        console.error(error);
      } else {
        console.error("An unknown error occurred while removing friend.");
      }
    }
  };

  const handleAddFriend = async () => {
    try {
      await apiService.post(
        `/users/${loggedInUsersId}/friendrequests`,
        diplayedUsersId,
      );
      messageAPI.success(`Friend request sent to ${displayedUser.username}`);

      const updatedUser: User = await apiService.get<User>(
        `/users/${diplayedUsersId}`,
      );
      setDisplayedUser(updatedUser);
    } catch (error) {
      if (error instanceof Error) {
        messageAPI.error("Failed to send friend request.");
        console.error(error);
      } else {
        console.error("An unknown error occurred while sending friend request");
      }
    }
  };

  useEffect(() => {
    //TODO: here again we have the case, that this does not work when using the hook
    const StorageId = localStorage.getItem("id");
    if (!StorageId) {
      router.push("/");
      return;
    }

    const fetchUser = async () => {
      try {
        const user: User = await apiService.get<User>(
          `/users/${diplayedUsersId}`,
        );
        setDisplayedUser(user);
      } catch (error) {
        if (error instanceof Error) {
          alert(
            `Something went wrong while fetching the user:\n${error.message}`,
          );
          console.error(error);
        } else {
          console.error("An unknown error occurred while fetching the user.");
        }
      }
    };

    fetchUser();
  }, [apiService, diplayedUsersId, router]);

  /* TODO: this does not work when using the hook */
  if (localStorage.getItem("id") === diplayedUsersId) {
    return (
      <div>
        {contextHolder}
        <Header />
        <div className="card-container">
          <h2>Profile of {displayedUser.username}</h2>
          <div className="green-card">
            <p>
              <strong>Username:</strong> {displayedUser.username}
            </p>
            <p>
              <strong>Birthday:</strong> {displayedUser.birthday
                ? String(displayedUser.birthday).split("T")[0]
                : "N/A"}
            </p>
            <p>
              <strong>Creationdate:</strong> {displayedUser.creation_date
                ? String(displayedUser.creation_date).split("T")[0]
                : "N/A"}
            </p>
            <p>
              <strong>Status:</strong> {displayedUser.status}
            </p>
            <Space style={{ marginTop: 10 }}>
              {/* TODO: is one of these options primary and the others secondary or are all equal? */}
              <Button type="primary" onClick={handleGoBack}>Back</Button>
              <Button type="primary" onClick={handleLogout}>
                Logout
              </Button>
              <Button type="primary" onClick={handleEdit}>Edit</Button>
            </Space>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {contextHolder}
      <Header />
      <div className="card-container">
        <h2>Profile of {displayedUser.username}</h2>
        <div className="green-card">
          <p>
            <strong>Username:</strong> {displayedUser.username}
          </p>
          <p>
            <strong>Birthday:</strong> {displayedUser.birthday
              ? String(displayedUser.birthday).split("T")[0]
              : "N/A"}
          </p>
          <p>
            <strong>Creationdate:</strong> {displayedUser.creation_date
              ? String(displayedUser.creation_date).split("T")[0]
              : "N/A"}
          </p>
          <p>
            <strong>Status:</strong> {displayedUser.status}
          </p>
          <Space style={{ marginTop: 10 }}>
            <Button type="primary" onClick={handleGoBack}>Back</Button>
            {
              //Check if the current user's ID is in the friends list of the user of this profile
              //TODO: check localStorage usage
              (displayedUser.friends?.includes(
                  Number(localStorage.getItem("id")),
                ))
                ? (
                  <Button type="primary" onClick={handleRemoveFriend}>
                    Remove Friend
                  </Button>
                )
                : (displayedUser.friendrequests?.includes(
                    Number(localStorage.getItem("id")),
                  ))
                ? <p>pending friendrequest...</p>
                : (
                  <Button type="primary" onClick={handleAddFriend}>
                    Add Friend
                  </Button>
                )
            }
          </Space>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
