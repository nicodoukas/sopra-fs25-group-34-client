"use client";

import {useState} from "react";
import GamePage from "./gamepage";
import EndScreen from "./endscreen";
import Challenge from "./challenge";


const GameLogic = () => {
  const [isGameOver, setIsGameOver] = useState(false);
  const [isChallenge, setIsChallenge] = useState(false);

  if (isGameOver) {
    return <EndScreen />;
  }

  if (isChallenge) {
    return <Challenge />;
  }

  return (
    <GamePage
      onGameEnd={() => setIsGameOver(true)}
      onStartChallenge={() => setIsChallenge(true)}
    />
  );
}
export default GameLogic;