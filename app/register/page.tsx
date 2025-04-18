"use client";

import React from "react";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";

import "@ant-design/v5-patch-for-react-19";
import { Button, Form, Input } from "antd";

import "@/styles/login_register.css";

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
  } = useLocalStorage<string>("token", "");

  const {
    set: setID,
  } = useLocalStorage<string>("id", "");

  const handleRegister = async (values: FormFieldProps) => {
    try {
      const response = await apiService.post<User>("/users", values);

      if (response.token) {
        setToken(response.token);
      }

      if (response.id) {
        setID(response.id);
      }

      //TODO: this needs to change once I do not have /users as overview page
      router.push("/users");
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the login:\n${error.message}`);
        console.error(error);
      } else {
        console.error("An unknown error occurred during login.");
      }
    }
  };

  return (
    <div className="register-container">
      <h2>
        Create a new account
      </h2>
      <div className="register-card">
        <Form
          form={form}
          name="register"
          size="large"
          onFinish={handleRegister}
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
