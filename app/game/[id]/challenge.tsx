import React, { useEffect, useRef, useState } from "react";

import { SongCard } from "@/types/songcard";
import { Player } from "@/types/player";
import Timeline from "./timeline";
import Timer from "@/game/[id]/timer";

import { Button } from "antd";

import { Client } from "@stomp/stompjs";

interface Props {
  activePlayer: Player;
  songCard: SongCard | null;
  gameId: string;
  gameName: string;
  activePlayerPlacement: number;
  stompClient: Client | null;
  userId: string | null;
  checkCardPlacementCorrect: (
    songCard: SongCard,
    timeline: SongCard[],
    placement: number,
  ) => Promise<boolean>;
  allPlayers: Player[];
}

const Challenge: React.FC<Props> = ({
  activePlayer,
  gameId,
  gameName,
  activePlayerPlacement,
  stompClient,
  userId,
  allPlayers,
}) => {
  const hasRun = useRef(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [decisionMade, setDescisionMade] = useState<boolean>(false);

  //Timer
  useEffect(() => {
    let alreadyHandled = false;
    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { //only one second left
          if (!alreadyHandled) {
            alreadyHandled = true;
            handleDeclineChallenge();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000); //every second (1s = 1000ms)

    return () => clearInterval(countdown);
  }, []);

  //If only one player challenge is skipped
  useEffect(() => {
    if (!hasRun.current && allPlayers.length === 1) {
      handleDeclineChallenge();
      hasRun.current = true;
    }
  }, []);

  const _confirmPlacement = function (_index: number) {
    // the timeline component can internally only throw the confirmPlacement event, if isPlacementMode is
    // true, but I still need to list the event in the component and call some method
    console.log(_index);
  };

  const handleChallengeAccepted = () => {
    if (stompClient?.connected) {
      setDescisionMade(true);
      stompClient.publish({
        destination: "/app/challenge/accept",
        body: JSON.stringify({
          gameId,
          userId: sessionStorage.getItem("id"),
        }),
      });
    }
  };
  const handleDeclineChallenge = () => {
    if (stompClient?.connected) {
      setDescisionMade(true);
      (stompClient as Client).publish({
        destination: "/app/userDeclinesChallenge",
        body: JSON.stringify({
          gameId: gameId ?? "",
          userId: userId ?? "",
        }),
      });
    }
  };

  return (
    <div
      className="beige-card"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <h2 style={{ fontSize: "1.5rem", marginBottom: "0px" }}>{gameName}</h2>
      <h3>Challenge phase</h3>
      <Timer timeLeft={timeLeft}></Timer>
      {activePlayer.userId === userId
        ? (
          <p style={{ marginTop: "20px", marginBottom: "10px" }}>
            Other players can now challenge your placement.
          </p>
        )
        : (
          <>
            <Timeline
              title={activePlayer.username + "'s placement:"}
              timeline={activePlayer.timeline}
              isPlaying={false}
              isPlacementMode={false}
              confirmPlacement={_confirmPlacement}
              activePlayerPlacement={activePlayerPlacement}
              challenge={true}
            />
            {!decisionMade && (
              <div className="challenge-buttons-container">
                <Button type="primary" onClick={handleChallengeAccepted}>
                  Challenge
                </Button>
                <Button type="primary" onClick={handleDeclineChallenge}>
                  Don&#39;t challenge
                </Button>
              </div>
            )}
          </>
        )}
    </div>
  );
};

export default Challenge;
