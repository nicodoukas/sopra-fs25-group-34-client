"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";

import "@ant-design/v5-patch-for-react-19";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Input, Space } from "antd";

import styles from "@/styles/page.module.css";

const Overview: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [username] = useState<string | null>(null);
  const [searchUsername, setSearchUsername] = useState(""); // save input username

  const {
    value: id,
  } = useLocalStorage<string>("id", "");

  const handleSearch = async (): Promise<void> => {
    if (!searchUsername.trim()) {
      alert("Enter a username to search for.");
      return;
    }
    try {
      const user: User = await apiService.get<User>(
        `/usersByUsername/${searchUsername}`,
      );
      console.log("user: ", user);
      console.log("userId: ", user.id);
      if (user && user.id) {
        router.push(`/users/${user.id}`);
      } else {
        alert(`No user with username ${searchUsername} exists.`);
      }
    } catch {
      alert(`No user with username ${searchUsername} exists.`);
    }
  };

  return (
    <div className={styles.page}>
      <Space style={{ position: "absolute", top: 20, left: 20, zIndex: 10 }}>
        <Input
          placeholder="Search for a user..."
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          style={{ height: "40px", fontSize: "16px" }}
        />
        <Button onClick={handleSearch} icon={<SearchOutlined />} />
      </Space>
      <Button
        onClick={() => router.push(`/users/${id}`)}
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
        }}
      >
        {`My Profile (${username})`}
      </Button>
      <div className={styles.main}>
        <div className={styles.ctas}>
          <h2>
            Welcome to Hitster!
          </h2>
        </div>
        <div className={styles.ctas}>
          <>
            <Button
              type="primary"
              onClick={() => router.push(`/users/${id}/friends`)}
            >
              My Friend List
            </Button>
            <Button
              type="primary"
              onClick={() => router.push("/lobby/create")}
            >
              Create a new Lobby
            </Button>
            <Button
              type="primary"
              onClick={() =>
                router.push(
                  `/users/${id}/friends-lobby-requests`,
                )}
            >
              Friends & Lobby requests
            </Button>
          </>
        </div>
      </div>
    </div>
  );
};

export default Overview;
