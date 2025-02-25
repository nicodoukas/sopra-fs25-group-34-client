"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Card, Table } from "antd";
import type { TableProps } from "antd";


const UserProfile: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const params = useParams();
  const id = params.id;
  console.log("userid:", id);


  const [user, setUser] = useState<User>({} as User);
  const [loading, setLoading] = useState(true); //for loading display

  useEffect(() => {

    if (!id) return;


    const fetchUser = async () => {
        try {
          const user: User = await apiService.get<User>(`/users/${id}`);
          setUser(user);
          console.log("Fetched user:", user);
        } catch (error) {

          if (error instanceof Error) {
            alert(`Something went wrong while fetching the user:\n${error.message}`);
          } else {
            console.error("An unknown error occurred while fetching the user.");
          }
        }
    };

    fetchUser();

  }, [apiService,id]);

  return (
    <div className="card-container" style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
      <Card title={user.username} variant="outlined" style={{ width: 400 }}>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Creationdate:</strong> {user.creationdate}</p>
        <p><strong>Birthday:</strong> {user.birthday}</p>
        <p><strong>Status:</strong> {user.status}</p>
      </Card>
    </div>
  );
};

export default UserProfile;
