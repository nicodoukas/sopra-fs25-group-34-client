"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { useApi } from "@/hooks/useApi";
import useSessionStorage from "@/hooks/useSessionStorage";
import { User } from "@/types/user";

import { SearchOutlined } from "@ant-design/icons";
import { Button, Input, message, Space } from "antd";

import styles from "./header.module.css";

export default function Header() {
  const router = useRouter();
  const apiService = useApi();
  const [searchUsername, setSearchUsername] = useState(""); // save searched username
  
  const {
    value: id,
  } = useSessionStorage<string>("id", "");

  const {
    value: username,
  } = useSessionStorage<string>("username", "");

  const handleSearch = async (): Promise<void> => {
    if (!searchUsername.trim()) {
      message.error("Please enter a username to search for.");
      return;
    }

    try {
      const user: User = await apiService.get<User>(
        `/usersByUsername/${searchUsername}`,
      );
      if (user && user.id) {
        router.push(`/users/${user.id}`);
      } else {
        message.error(
          `No user with username ${searchUsername} exists. Please recheck your spelling.`,
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(
          `No user with username ${searchUsername} exists. Please recheck your spelling.`,
        );
      } else {
        message.error("An unknown error occured, please try again later.");
        console.error("An unknown error occurred while searching the user");
      }
      console.error(error);
    }
  };

  if (!id) return null;

  return (
    <header>
      <Space className={styles.searchBar}>
        <Input
          placeholder="Search for a user..."
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          className={styles.searchInput}
          onPressEnter={handleSearch}
        />
        <Button onClick={handleSearch} icon={<SearchOutlined />} />
      </Space>
      <Button
        onClick={() => router.push(`/users/${id}`)}
        className={styles.profileButton}
      >
        {`My Profile (${username})`}
      </Button>
    </header>
  );
}
