"use client";

import "@ant-design/v5-patch-for-react-19";
import { Button } from "antd";
import { useRouter } from "next/navigation";

import styles from "@/styles/page.module.css";

export default function Home() {
  const router = useRouter();
  return (
    <div className={styles.page}>
      <div className={styles.main}>
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
  );
}
