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

const Login: React.FC = () => {
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

  const handleLogin = async (values: FormFieldProps) => {
    try {
      const response = await apiService.post<User>("/login", values);

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
            "404:",
          )
        ) {
          message.error(
            "No user found with this username, check your spelling or register as a new user.",
          );
        } else if (
          error.message.includes(
            "Invalid password",
          )
        ) {
          message.error(
            "Invalid password, please check your spelling.",
          );
        } else {
          message.error(error.message);
        }
      } else {
        message.error("An unknown error occurred during login.");
      }
      console.error(error);
    }
  };

  return (
    <div className="card-container">
      <h2>
        Log in to your account
      </h2>
      <div className="green-card">
        <Form
          form={form}
          name="login"
          size="large"
          onFinish={handleLogin}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
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
              Log in
            </Button>
          </Form.Item>
          <Form.Item>
            <Button
              type="link"
              onClick={() => router.push("register")}
              style={{ color: "#283618" }}
            >
              No account? -&gt; Click here to Register
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;
