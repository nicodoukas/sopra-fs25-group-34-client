"use client";

import { useRouter } from "next/navigation";

import "@ant-design/v5-patch-for-react-19";
import { Button, Steps } from "antd";
import {
  AudioOutlined,
  LayoutOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";

import styles from "@/styles/page.module.css";

export default function Home() {
  const howItWorksSteps = [
    {
      description: "sign up or log in",
      icon: <UserOutlined />,
    },
    {
      description: "connect with your friends",
      icon: <TeamOutlined />,
    },
    {
      description: "create or join a lobby",
      icon: <LayoutOutlined />,
    },
    {
      description: (
        <>
          listen to a song<br />
          guess the song & its release year
        </>
      ),
      icon: <AudioOutlined />,
    },
    {
      description: "collect the most song cards to win",
      icon: <TrophyOutlined />,
    },
  ];

  const router = useRouter();
  return (
    <div className={styles.landingPage}>
      <div className={styles.header}>
        <h1>Hitster</h1>
        <p>
          The ultimate party game for music lovers – guess a songs release year,
          collect the most song cards and beat your friends!
        </p>
      </div>
      <div className={styles.landingPageCardsContainer}>
        <div className="beige-card">
          <h2 className="smaller-h2">How it works</h2>
          <Steps
            direction="vertical"
            size="small"
            current={5}
            items={howItWorksSteps}
          />
        </div>
        <div className="beige-card">
          <h2 className="smaller-h2">Join the party</h2>
          <div className={styles.ctas}>
            <Button
              type="primary"
              onClick={() => router.push("/login")}
            >
              Login
            </Button>
            <Button
              type="primary"
              onClick={() => router.push("/register")}
            >
              Register
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
