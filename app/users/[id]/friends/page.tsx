"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import withAuth from "@/utils/withAuth";
import Header from "@/components/header";

import "@ant-design/v5-patch-for-react-19";
import { Button, message, Table } from "antd";
import type { TableProps } from "antd";

const columns: TableProps<User>["columns"] = [
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
    render: (text, record) => (
      <div style={{ display: "flex", flexDirection: "row" }}>
        <div
          className="profile-picture"
          style={{
            width: 30,
            height: 30,
            marginRight: "15px",
            position: "relative",
          }}
        >
          <img src={record.profilePicture?.url} alt="profile picture" />
        </div>
        <span>{text}</span>
      </div>
    ),
  },
];

const FriendList: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [friends, setFriends] = useState<User[] | null>(null);

  const params = useParams();
  const displayedUsersId = params.id;
  const [isLogedInUser, setIsLogedInUser] = useState<boolean | null>(null);
  const hasHandledNotLoggedInUser = useRef(false);

  useEffect(() => {
    if (sessionStorage.getItem("id") != displayedUsersId) {
      if (!hasHandledNotLoggedInUser.current) {
        hasHandledNotLoggedInUser.current = true;
        message.info("You can only view your own friends");
        router.back();
      }
    } else {
      setIsLogedInUser(true);
    }

    const fetchFriends = async () => {
      try {
        const user: User = await apiService.get<User>(
          `/users/${sessionStorage.getItem("id")}`,
        );

        const friendIdList: number[] = user.friends;
        const friends: User[] = [];

        for (const friendId of friendIdList) {
          const friend: User = await apiService.get<User>(`/users/${friendId}`);
          friends.push(friend);
        }
        setFriends(friends);
      } catch (error) {
        if (error instanceof Error) {
          message.error(
            `Something went wrong while loading a user:\n${error.message}`,
          );
        } else {
          message.error("An unknown error occurred while loading a user.");
        }
        console.error(error);
      }
    };

    fetchFriends();
  }, [apiService, router]);

  if (!isLogedInUser) return <div>Loading...</div>;

  return (
    <div>
      <Header />
      <div className="card-container">
        <h2>Friends list</h2>
        <div className="green-card">
          {(friends && friends.length >= 1)
            ? (
              <div
                className="light-beige-card"
                style={{ marginBottom: "20px" }}
              >
                <div style={{ overflowY: "auto", maxHeight: "48vh" }}>
                  <Table<User>
                    columns={columns}
                    dataSource={friends}
                    rowKey="id"
                    onRow={(row) => ({
                      onClick: () => router.push(`/users/${row.id}`),
                      style: { cursor: "pointer" },
                    })}
                    size="middle"
                    pagination={false}
                  />
                </div>
              </div>
            )
            : (
              <div className="textWrapper">
                <p>You do not yet have any friends.</p>
                <p>Search for any username and send them a request.</p>
              </div>
            )}
          <Button onClick={() => router.back()} type="primary">
            Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default withAuth(FriendList);
