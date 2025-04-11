"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Typography, Card } from "antd";

const { Title } = Typography;

const GamePage = () => {
  const router = useRouter();
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f2f5",
        flexDirection: "column",
      }}
    >
      <Card
        style={{
          padding: "40px",
          width: "600px",
          textAlign: "center",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      >
        <Title level={2} style={{ color: "#1890ff" }}>
          mock of game page
        </Title>
        <Button type="primary" onClick={() => router.back}>
          Back to Lobby-Screen
        </Button>
      </Card>
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          fontSize: "14px",
          color: "#aaa",
        }}
      >
        Hitster by Group 24, SoPra FS25
      </div>
    </div>
  );
};

export default GamePage;
