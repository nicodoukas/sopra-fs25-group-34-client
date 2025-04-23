"use client";

import {useState} from "react";
import GamePage from "./gamepage";
import EndScreen from "./endscreen";


const GameLogic = () => {
  const [isGameOver, setIsGameOver] = useState(false);

  return isGameOver ? (
    <EndScreen/>
  ) : (
    <GamePage onGameEnd={() => setIsGameOver(true)}/>
  )
}
export default GameLogic;