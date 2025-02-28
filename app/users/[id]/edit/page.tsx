"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
//import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Card, Form, Input } from "antd";

interface FormFieldProps {
  username: string;
  birthday: string;
}

const EditUserProfile: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const params = useParams();
  const id = params.id;

  const [user, setUser] = useState<User>({} as User);
  const [form] = Form.useForm();

  const handleGoBack = () => {
    router.push(`/users/${id}`); //navigates to the previous page
  };

  const handleSave = async (values: FormFieldProps) => {
    console.log("update requestBody:", values);

    try {
      await apiService.put(`/users/${id}`, values);
      console.log("User updated correctly");
      router.push(`/users/${id}`);
    } catch (error) {
      if (error instanceof Error) {
        alert(
          `Something went wrong while updating the user:\n${error.message}`,
        );
      } else {
        console.error("An unknown error occurred while updating the user.");
      }
    }
  };

  useEffect(() => {
    const StorageId = localStorage.getItem("id");
    if (!StorageId || StorageId != id) {
      router.push("/users");
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
        } else {
          console.error("An unknown error occurred while fetching the user.");
        }
      }
    };

    fetchUser();
  }, [apiService, id, router]);

  return (
    <div
      className="card-container"
      style={{ display: "flex", justifyContent: "center", marginTop: 20 }}
    >
      <Card title={user.username} variant="outlined" style={{ width: 400 }}>
        <Form
          form={form}
          size="large"
          variant="outlined"
          onFinish={handleSave}
          layout="horizontal"
        >
          <Form.Item
            name="username"
            label={<strong>Username:</strong>}
          >
            <Input placeholder={user.username ?? ""} />
          </Form.Item>
          <Form.Item
            name="birthday"
            label={<strong>Birthday:</strong>}
          >
            <Input placeholder={user.birthday?.toString() ?? "YYYY-MM-DD"} />
          </Form.Item>
          <Form.Item>
            <p>
              <strong>Creationdate:</strong> {user.creationdate}
            </p>
          </Form.Item>
          <Form.Item>
            <p>
              <strong>Status:</strong> {user.status}
            </p>
          </Form.Item>
          <Form.Item>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 16,
              }}
            >
              <Button type="primary" onClick={handleGoBack}>Go Back</Button>
              <Button type="primary" htmlType="submit">Save</Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EditUserProfile;
