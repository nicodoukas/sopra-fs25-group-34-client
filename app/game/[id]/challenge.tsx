import React from "react";
import { SongCard } from "@/types/songcard";
import Timeline from "./timeline";

import { Button } from "antd";
import { Client } from "@stomp/stompjs";

interface Props {
  activePlayersTimeline: SongCard[];
  songCard: SongCard | null;
  gameId: string;
  gameName: string;
  activePlayerName: string | null;
  activePlayerPlacement: number;
  challengeHandeled: () => void;
  stompClient: Client | null;
}
//TODO: maybe I can pass the whole active player

const Challenge: React.FC<Props> = ({
  activePlayersTimeline,
  songCard,
  gameId,
  gameName,
  activePlayerName,
  activePlayerPlacement,
  challengeHandeled,
  stompClient,
}) => {
  const randomMethod = function (index: number) {
    //the can only throw the confirmPlacement method, when isPlacementMode=true
    //but i stil need to catch it
  };

  const handleChallengeAccepted = async () => {
    console.log("in handleChallengeAccepted of challenge.tsx");
    if (stompClient?.connected) {
      console.log("in if stompClient");
      stompClient.publish({
        destination: "/app/challenge/accept",
        body: JSON.stringify({
          gameId,
          userId: sessionStorage.getItem("id"),
        }),
      });
    }
  };

  const handleChallengeDeclined = async () => {
    //TODO: deal with timer or everyone declined
  };

  const toRemoveButton = async () => {
    challengeHandeled();
  };

  return (
    <div className="beige-card">
      <h2 style={{ fontSize: "1.5rem", marginBottom: "0px" }}>{gameName}</h2>
      <h3>Challenge phase</h3>
      <Timeline
        title={activePlayerName + "'s placement:"}
        timeline={activePlayersTimeline}
        songCard={songCard}
        gameId={gameId}
        isPlaying={false}
        isPlacementMode={false}
        confirmPlacement={randomMethod}
        activePlayerPlacement={activePlayerPlacement}
      />
      <Button type="primary" onClick={handleChallengeAccepted}>
        Challenge
      </Button>
      <Button type="primary" onClick={handleChallengeDeclined}>
        Don't challenge
      </Button>
      <Button onClick={toRemoveButton}>Simulate challenge beeing over</Button>
    </div>
  );
};

export default Challenge;
