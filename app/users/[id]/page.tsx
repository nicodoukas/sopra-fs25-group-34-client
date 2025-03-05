"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
//import useLocalStorage from "@/hooks/useLocalStorage";
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
    router.push("/users"); //navigates to the previous page
  };

  const handleEdit  = () => {
    router.push(`/users/${id}/edit`);
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
        style={{ display: "flex", justifyContent: "center", marginTop: 20 }}
      >
        <Card title={user.username} variant="outlined" style={{ width: 400 }}>
          <p>
            <strong>Username:</strong> {user.username}
          </p>
          <p>
            <strong>Birthday:</strong> {user.birthday?.split('T')[0]}
          </p>
          <p>
            <strong>Creationdate:</strong> {user.creation_date?.split('T')[0]}
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
      </div>
    );
  }
  return (
    <div
      className="card-container"
      style={{ display: "flex", justifyContent: "center", marginTop: 20 }}
    >
      <Card title={user.username} variant="outlined" style={{ width: 400 }}>
        <p>
          <strong>Username:</strong> {user.username}
        </p>
        <p>
          <strong>Birthday:</strong> {user.birthday}
        </p>
        <p>
          <strong>Creationdate:</strong> {user.creation_date}
        </p>
        <p>
          <strong>Status:</strong> {user.status}
        </p>
        <div style={{ display: "flex", marginTop: 16 }}>
          <Button type="primary" onClick={handleGoBack}>Go Back</Button>
        </div>
      </Card>
    </div>
  );
};

export default UserProfile;
