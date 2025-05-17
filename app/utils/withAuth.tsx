"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { message } from "antd";

export default function withAuth<P extends object>(
  Component: React.ComponentType<P>,
): React.FC<P> {
  const AuthenticatedComponent: React.FC<P> = (props) => {
    
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(
      null,
    );

    useEffect(() => {
      const userId = sessionStorage.getItem("id");

      if (!userId) {
        setTimeout(() => {
          message.info("Please log in or register to access this page.");
        }, 200);
        router.push("/");
      } else {
        setIsAuthenticated(true);
      }
    }, [router]);

    if (isAuthenticated === null) {
      return <div>Loading...</div>;
    }

    return <Component {...props} />;
  };

  return AuthenticatedComponent;
}
