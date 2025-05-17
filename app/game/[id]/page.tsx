"use client";

import { useState } from "react";
import withAuth from "@/utils/withAuth";
import GamePage from "./gamepage";
import EndScreen from "./endscreen";

const GameLogic = () => {
  const [isGameOver, setIsGameOver] = useState(false);

  if (isGameOver) {
    return <EndScreen />;
  }

  return (
    <GamePage
      onGameEnd={() => setIsGameOver(true)}
    />
  );
};

export default withAuth(GameLogic);
