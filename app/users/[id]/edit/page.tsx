"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import Header from "@/components/header";

import "@ant-design/v5-patch-for-react-19";
import { Button, Form, Input, Space } from "antd";

interface FormFieldProps {
  username: string;
  birthday: string;
}

const EditUserProfile: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const params = useParams();
  const displayedUsersId = params.id;

  const [user, setUser] = useState<User>({} as User);
  const [form] = Form.useForm();

  const handleGoBack = () => {
    router.back();
  };

  const handleSave = async (values: FormFieldProps) => {
    try {
      await apiService.put(`/users/${displayedUsersId}`, values);
      router.push(`/users/${displayedUsersId}`);
    } catch (error) {
      if (error instanceof Error) {
        alert(
          `Something went wrong while updating the user:\n${error.message}`,
        );
        console.error(error);
      } else {
        console.error("An unknown error occurred while updating the user.");
      }
    }
  };

  useEffect(() => {
    const StorageId = sessionStorage.getItem("id");
    if (!StorageId) {
      router.push("/");
      return;
    }
    if (StorageId != displayedUsersId) {
      router.back();
      return;
    }

    const fetchUser = async () => {
      try {
        const user: User = await apiService.get<User>(
          `/users/${displayedUsersId}`,
        );
        setUser(user);
      } catch (error) {
        if (error instanceof Error) {
          alert(
            `Something went wrong while fetching the user:\n${error.message}`,
          );
          console.error(error);
        } else {
          console.error("An unknown error occurred while fetching the user.");
        }
      }
    };

    fetchUser();
  }, [apiService, displayedUsersId, router]);

  return (
    <div>
      <Header />
      <div className="card-container">
        <h2>Edit your profile</h2>
        <div className="green-card">
          <Form
            form={form}
            size="large"
            onFinish={handleSave}
            layout="horizontal"
          >
            <Form.Item
              name="username"
              label={<strong>Username</strong>}
            >
              <Input placeholder={user.username ?? ""} />
            </Form.Item>
            <Form.Item
              name="birthday"
              label={<strong>Birthday</strong>}
            >
              <Input
                placeholder={user.birthday
                  ? String(user.birthday).split("T")[0]
                  : "YYYY-MM-DD"}
              />
            </Form.Item>
            <Form.Item>
              <p>
                <strong>Creationdate:</strong> {user.creation_date
                  ? String(user.creation_date).split("T")[0]
                  : "N/A"}
              </p>
            </Form.Item>
            <Form.Item>
              <p>
                <strong>Status:</strong> {user.status}
              </p>
            </Form.Item>
            <Form.Item>
              <Space>
                <Button onClick={handleGoBack}>Back</Button>
                <Button type="primary" htmlType="submit">Save</Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default EditUserProfile;
