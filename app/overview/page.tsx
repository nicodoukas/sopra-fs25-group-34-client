"use client";

import React, {useEffect} from "react";
import { useRouter } from "next/navigation";
import useSessionStorage from "@/hooks/useSessionStorage";
import Header from "@/components/header";

import "@ant-design/v5-patch-for-react-19";
import { Button, message } from "antd";

import styles from "@/styles/page.module.css";

const Overview: React.FC = () => {
  const router = useRouter();
  const [messageAPI, contextHolder] = message.useMessage();
  const {
    value: id,
  } = useSessionStorage<string>("id", "");

  useEffect(() => {
    const info = sessionStorage.getItem("infoMessage");
    if (info) {
      messageAPI.info(info, 5);
      sessionStorage.removeItem("infoMessage");
    }
  }, []);

  return (
    <div className={styles.page}>
      {contextHolder}
      <Header />
      <div className={styles.main}>
        <div className={styles.ctas}>
          <h2>
            Welcome to Hitster!
          </h2>
        </div>
        <div className={styles.ctas}>
          <>
            <Button
              type="primary"
              onClick={() => router.push(`/users/${id}/friends`)}
            >
              My Friend List
            </Button>
            <Button
              type="primary"
              onClick={() => router.push("/lobby/create")}
            >
              Create a new Lobby
            </Button>
            <Button
              type="primary"
              onClick={() =>
                router.push(
                  `/users/${id}/friends-lobby-requests`,
                )}
            >
              Friends & Lobby requests
            </Button>
          </>
        </div>
      </div>
    </div>
  );
};

export default Overview;
