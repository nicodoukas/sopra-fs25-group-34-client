import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "@ant-design/v5-patch-for-react-19";
import { ConfigProvider, theme } from "antd";
import { AntdRegistry } from "@ant-design/nextjs-registry";

import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hitster",
  description: "Hitster by Group 34 SoPra FS25",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        style={{
          backgroundImage: "url(/background.png)",
          backgroundPosition: "center",
          /* TODO: check on different devices, maybe needs backgroundSize: 'cover', and backgroundRepeat: 'no-repeat' */
        }}
      >
        <div className="background-overlay" />
        <ConfigProvider
          theme={{
            algorithm: theme.defaultAlgorithm,
            token: {
              /*sets defaults for ant components */
              colorPrimary: "#BC6C25",
              borderRadius: 8,
              colorText: "#283618",
              fontSize: 16,
              colorBgContainer: "#FEFAE0",
              colorBorder: "#DDA15E",
            },
            components: {
              Button: {
                controlHeight: 38,
                controlOutline: "none",
                controlOutlineWidth: 0,
              },
              Input: {
                colorBorder: "#283618",
                colorTextPlaceholder: "#888888",
                activeBorderColor: "#bc6c25",
                activeShadow: "0 0 0 2px rgba(188, 108, 37, 0.2)",
                hoverBorderColor: "#bc6c25",
                algorithm: false,
              },
              /* TODO: go through these as i go through the pages and see the corresponding components */
              /*               Message: {
                colorText: "#283618",
                colorBgContainer: "#FEFAE0",
              },
              Card: {}, */
            },
          }}
        >
          <AntdRegistry>
            <div className="content-container">
              <main>
                {children}
              </main>
              <footer>Hitster by Group 34 SoPra FS25</footer>
            </div>
          </AntdRegistry>
        </ConfigProvider>
      </body>
    </html>
  );
}
