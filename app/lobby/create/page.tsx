"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useApi } from "@/hooks/useApi";
import useSessionStorage from "@/hooks/useSessionStorage";
import { Lobby } from "@/types/lobby";
import { User } from "@/types/user";
import Header from "@/components/header";

import { Button, Form, Input, message } from "antd";

interface FormFieldProps {
  lobbyName: string;
}

const CreateLobby: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  const [user, setUser] = useState<User>({} as User);

  const {
    value: id,
  } = useSessionStorage<string>("id", "");

  const handleCreateLobby = async (values: FormFieldProps) => {
    try {
      const RequestBody = { host: user, lobbyName: values.lobbyName };
      const currentLobby = await apiService.post<Lobby>(
        `/lobbies`,
        RequestBody,
      );
      router.push(`/lobby/${currentLobby.lobbyId}`);
    } catch (error) {
      if (error instanceof Error) {
        message.error(
          `Something went wrong while creating the lobby:\n${error.message}`,
        );
      } else {
        message.error("An unknown error occurred while creating the lobby.");
      }
      console.error(error);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        const user: User = await apiService.get<User>(`/users/${id}`);
        setUser(user);
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
  }, [apiService, id, router]);

  return (
    <div className="card-container">
      <Header />
      <h2>Create a lobby</h2>
      <div className="green-card">
        <Form
          form={form}
          name="createLobby"
          size="large"
          onFinish={handleCreateLobby}
          layout="vertical"
        >
          <Form.Item
            name="lobbyName"
            rules={[{ required: true, message: "Please input a lobby name!" }]}
          >
            <Input placeholder="Lobby name" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create Lobby
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={() => router.push("/overview")} block>
              Go Back
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default CreateLobby;
