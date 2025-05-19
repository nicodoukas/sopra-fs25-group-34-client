"use client";

import React from "react";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useSessionStorage from "@/hooks/useSessionStorage";
import { User } from "@/types/user";

import { Button, Form, Input, message } from "antd";

interface FormFieldProps {
  username: string;
  password: string;
}

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();

  const {
    set: setToken,
  } = useSessionStorage<string>("token", "");

  const {
    set: setID,
  } = useSessionStorage<string>("id", "");

  const {
    set: setUsername,
  } = useSessionStorage<string>("username", "");

  const handleRegister = async (values: FormFieldProps) => {
    try {
      const response = await apiService.post<User>("/users", values);

      if (response.token) {
        setToken(response.token);
      }

      if (response.id) {
        setID(response.id);
      }

      if (response.username) {
        setUsername(response.username);
      }

      router.push("/overview");
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes(
            "409: The username provided is not unique. Therefore, the user could not be created!",
          )
        ) {
          message.error(
            "The username provided is not unique. Please use another username.",
          );
        } else {
          message.error(error.message);
        }
      } else {
        message.error("An unknown error occured during registration");
      }
      console.error(error);
    }
  };

  return (
    <div className="card-container">
      <h2>
        Create a new account
      </h2>
      <div className="green-card">
        <Form
          form={form}
          name="register"
          size="large"
          onFinish={handleRegister}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: "Please input your username!" },
              { pattern: /^(?!\s*$).+/, message: "Username cannot be empty!"}
            ]}
          >
            <Input placeholder="Username" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input type="password" placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create account
            </Button>
          </Form.Item>
          <Form.Item>
            <Button
              type="link"
              onClick={() => router.push("login")}
              style={{ color: "#283618" }}
            >
              Already have an account? -&gt; Sign in
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Register;
