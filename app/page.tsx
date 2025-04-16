"use client";

import "@ant-design/v5-patch-for-react-19";
import { Button } from "antd";
import { useRouter } from "next/navigation";

import styles from "@/styles/page.module.css";

export default function Home() {
  const router = useRouter();
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {/* TODO: das main muss ich rauslöschen weils schon in layout.tsx ist */}
        <div className={styles.ctas}>
          <Button
            type="primary"
            variant="solid"
            onClick={() => router.push("/login")}
          >
            Login
          </Button>
          <Button
            type="primary"
            variant="solid"
            onClick={() => router.push("/register")}
          >
            Register
          </Button>
        </div>
      </main>
      {/* TODO: probalby auch footer entfernen da auch schon in layout.tsx */}
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
