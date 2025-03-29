"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import "@ant-design/v5-patch-for-react-19";
import { Button, Card, Table } from "antd";
import type { TableProps } from "antd";

const columns: TableProps<User>["columns"] = [
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
  },
];

const FriendList: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [friends, setFriends] = useState<User[] | null>(null);

  useEffect(() => {
    const StorageId = localStorage.getItem("id");
    if (!StorageId) {
      router.push("/login");
      return;
    }
    const fetchFriends = async () => {
      try {
        const user: User = await apiService.get<User>(
          `/users/${localStorage.getItem("id")}`,
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
            `Something went wrong while fetching the user:\n${error.message}`,
          );
          console.log(error);
        } else {
          console.error("An unknown error occurred while fetching the user.");
        }
      }
    };

    fetchFriends();
  }, [apiService, router]);

  return (
    <div className="card-container">
      <Card
        title="Friends list"
        loading={!friends}
        className="friendlist-container"
      >
        {(friends && friends.length >= 1)
          ? (
            <Table<User>
              columns={columns}
              dataSource={friends}
              rowKey="id"
              onRow={(row) => ({
                onClick: () => router.push(`/users/${row.id}`),
                style: { cursor: "pointer" },
              })}
            />
          )
          : (
            <div>
              <p>You do not yet have any friends.</p>
              <p>Search for any username and send them a request.</p>
            </div>
          )}
        <Button onClick={() => router.back()} type="primary">
          Back
        </Button>
      </Card>
    </div>
  );
};

export default FriendList;
