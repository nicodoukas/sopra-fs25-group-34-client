"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useApi } from "@/hooks/useApi";
import useSessionStorage from "@/hooks/useSessionStorage";
import { User } from "@/types/user";
import Header from "@/components/header";

import { Button, message } from "antd";

const UserProfile: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const params = useParams();
  const diplayedUsersId = params.id;

  const [displayedUser, setDisplayedUser] = useState<User>({} as User);

  const {
    clear: clearToken,
  } = useSessionStorage<string>("token", "");

  const {
    value: loggedInUsersId,
    clear: clearId,
  } = useSessionStorage<string>("id", "");

  const {
    clear: clearUsername,
  } = useSessionStorage<string>("username", "");

  const handleLogout = async (): Promise<void> => {
    try {
      await apiService.put("/logout", loggedInUsersId);
    } catch (error) {
      if (error instanceof Error) {
        message.error(
          `Something went wrong during the log out:\n${error.message}`,
        );
      } else {
        message.error("An unknown error occurred during logout.");
      }
      console.error(error);
    }

    clearToken();
    clearId();
    clearUsername();

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
      message.success(`${displayedUser.username} removed from friend list`);

      const updatedUser: User = await apiService.get<User>(
        `/users/${diplayedUsersId}`,
      );
      setDisplayedUser(updatedUser);
    } catch (error) {
      if (error instanceof Error) {
        message.error("Failed to remove friend.");
      } else {
        message.error("An unknown error occurred while removing friend.");
      }
      console.error(error);
    }
  };

  const handleAddFriend = async () => {
    try {
      await apiService.post(
        `/users/${loggedInUsersId}/friendrequests`,
        diplayedUsersId,
      );
      message.success(`Friend request sent to ${displayedUser.username}`);

      const updatedUser: User = await apiService.get<User>(
        `/users/${diplayedUsersId}`,
      );
      setDisplayedUser(updatedUser);
    } catch (error) {
      if (error instanceof Error) {
        message.error("Failed to send friend request.");
      } else {
        message.error("An unknown error occurred while sending friend request");
      }
      console.error(error);
    }
  };

  useEffect(() => {
    //TODO: here again we have the case, that this does not work when using the hook
    const StorageId = sessionStorage.getItem("id");
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
  }, [apiService, diplayedUsersId, router]);

  /* TODO: this does not work when using the hook */
  if (sessionStorage.getItem("id") === diplayedUsersId) {
    return (
      <div>
        <Header />
        <div className="card-container">
          <h2 className="profile-title">Your Profile</h2>
          <div className="green-card profile-card">
            <div className="profile-header">
              <div className="username">
                <strong>Username:</strong> {displayedUser.username}
              </div>
              <div className="profile-picture">
                <img
                  src={displayedUser.profilePicture?.url}
                  alt="profile picture"
                />
              </div>
            </div>
            <div className="profile-field">
              <strong>Description:</strong>{" "}
              {displayedUser.description || <i>...</i>}
            </div>
            <div className="profile-field">
              <strong>Birthday:</strong> {displayedUser.birthday
                ? String(displayedUser.birthday).split("T")[0]
                : "N/A"}
            </div>
            <div className="profile-field">
              <strong>Account Created:</strong> {displayedUser.creation_date
                ? String(displayedUser.creation_date).split("T")[0]
                : "N/A"}
            </div>
            <div className="profile-field">
              <strong>Status:</strong> {displayedUser.status}
            </div>
            <div className="profile-buttons">
              <Button type="default" onClick={handleGoBack}>
                Back
              </Button>
              <Button type="primary" danger onClick={handleLogout}>
                Logout
              </Button>
              <Button
                type="primary"
                style={{
                  backgroundColor: "var(--primary-light)",
                  borderColor: "var(--primary-light)",
                }}
                onClick={handleEdit}
              >
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="card-container">
        <h2 className="profile-title">Profile of {displayedUser.username}</h2>
        <div className="green-card profile-card">
          <div className="profile-header">
            <div className="username">
              <strong>Username:</strong> {displayedUser.username}
            </div>
            <div className="profile-picture">
              <img
                src={displayedUser.profilePicture?.url}
                alt="profile picture"
              />
            </div>
          </div>
          <div className="profile-field">
            <strong>Description:</strong>{" "}
            {displayedUser.description || <i>...</i>}
          </div>
          <div className="profile-field">
            <strong>Birthday:</strong> {displayedUser.birthday
              ? String(displayedUser.birthday).split("T")[0]
              : "N/A"}
          </div>
          <div className="profile-field">
            <strong>Account Created:</strong> {displayedUser.creation_date
              ? String(displayedUser.creation_date).split("T")[0]
              : "N/A"}
          </div>
          <div className="profile-field">
            <strong>Status:</strong> {displayedUser.status}
          </div>
          <div className="profile-buttons">
            <Button type="default" onClick={handleGoBack}>
              Back
            </Button>
            {displayedUser.friends?.includes(
                Number(sessionStorage.getItem("id")),
              )
              ? (
                <Button type="primary" danger onClick={handleRemoveFriend}>
                  Remove Friend
                </Button>
              )
              : displayedUser.friendrequests?.includes(
                  Number(sessionStorage.getItem("id")),
                )
              ? (
                <p style={{ marginTop: 8, fontStyle: "italic" }}>
                  Pending friend request...
                </p>
              )
              : (
                <Button type="primary" onClick={handleAddFriend}>
                  Add Friend
                </Button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
