"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import { useRouter } from "next/navigation"; // use NextJS router for navigation
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import "@ant-design/v5-patch-for-react-19";
import { Button, Form, Input } from "antd";
import React from "react";
// Optionally, you can import a CSS module or file for additional styling:
// import styles from "@/styles/page.module.css";

interface FormFieldProps {
  username: string;
  password: string;
}

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  // useLocalStorage hook example use
  // The hook returns an object with the value and two functions
  // Simply choose what you need from the hook:
  const {
    // value: token, // is commented out because we do not need the token value
    set: setToken, // we need this method to set the value of the token to the one we receive from the POST request to the backend server API
    // clear: clearToken, // is commented out because we do not need to clear the token when logging in
  } = useLocalStorage<string>("token", ""); // note that the key we are selecting is "token" and the default value we are setting is an empty string
  // if you want to pick a different token, i.e "usertoken", the line above would look as follows: } = useLocalStorage<string>("usertoken", "");

  const handleRegister = async (values: FormFieldProps) => {
    try {
      // Call the API service and let it handle JSON serialization and error handling
      const response = await apiService.post<User>("/users", values);

      // Use the useLocalStorage hook that returned a setter function (setToken in line 41) to store the token if available
      if (response.token) {
        setToken(response.token);
      }

      // store user id inside localStorage
      if (response.id) {
        localStorage.setItem("id", response.id);
      }

      // Navigate to the user overview
      router.push("/users");
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the login:\n${error.message}`);
      } else {
        console.error("An unknown error occurred during login.");
      }
    }
  };

  return (
      <div
          className="login-container"
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgb(41, 44, 59)",
            textAlign: "center",
          }}
      >
        <h2 style={{ fontSize: "2.5rem", marginBottom: "30px" }}>
          Create a new account
        </h2>
        <div
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "30px",
              backgroundColor: "rgb(20, 20, 30)",
              borderRadius: "10px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
            }}
        >
          <Form form={form} name="register" size="large" onFinish={handleRegister} layout="vertical">
            <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: "Please input your username!" }]}
            >
              <Input placeholder="Choose a username" />
            </Form.Item>
            <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: "Please input your password!" }]}
            >
              <Input type="password" placeholder="Choose a password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="register-button" block>
                Create account
              </Button>
            </Form.Item>
            <Form.Item>
              <Button type="link" onClick={() => router.push("login")} style={{ color: "#1890ff", display: "flex"}}>
                Already have an account? -> Sign in
              </Button>
            </Form.Item>
          </Form>
        </div>
        <div
            style={{
              position: "absolute",
              bottom: "10px",
              left: "10px",
              fontSize: "16px",
              color: "lightblue",
            }}
        >
          Hitster by Group 24, SoPra FS25
        </div>
      </div>
  );
};

export default Register;
