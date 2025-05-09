"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import Header from "@/components/header";

import "@ant-design/v5-patch-for-react-19";
import { Button, Table } from "antd";
import type { TableProps } from "antd";

const columns: TableProps<User>["columns"] = [
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
    render: (text, record) => (
      <div style={{display: "flex", flexDirection:"row"}}>
        <div className="profile-picture" style={{
          width: 30,
          height: 30,
          marginRight: "15px",
          position: "relative"
        }}>
          <img src={record.profilePicture?.url} alt="profile picture"/>
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

  useEffect(() => {
    //TODO: when i replace this to use the useLocalStorage Hook it always trigers
    //also, when i replace it below in the fetchFreinds
    const StorageId = sessionStorage.getItem("id");
    if (!StorageId) {
      router.push("/");
      return;
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
          alert(
            `Something went wrong while fetching a user:\n${error.message}`,
          );
          console.error(error);
        } else {
          console.error("An unknown error occurred while fetching a user.");
        }
      }
    };

    fetchFriends();
  }, [apiService, router]);

  return (
    <div>
      <Header />
      <div className="card-container">
        <h2>Friends list</h2>
        <div className="green-card">
          {(friends && friends.length >= 1)
            ? (
              <div className="tableWrapper">
                <Table<User>
                  columns={columns}
                  dataSource={friends}
                  rowKey="id"
                  onRow={(row) => ({
                    onClick: () => router.push(`/users/${row.id}`),
                    style: { cursor: "pointer" },
                  })}
                  bordered
                />
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

export default FriendList;
