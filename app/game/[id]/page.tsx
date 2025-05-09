"use client";

import { useState } from "react";
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
export default GameLogic;
