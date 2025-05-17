import React, { useEffect, useState, useRef } from "react";

import { useApi } from "@/hooks/useApi";
import { SongCard } from "@/types/songcard";
import { Player } from "@/types/player";
import Timeline from "./timeline";
import Timer from "@/game/[id]/timer";

import { Button, message } from "antd";

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
  songCard,
  gameId,
  gameName,
  activePlayerPlacement,
  stompClient,
  userId,
  checkCardPlacementCorrect,
  allPlayers,
}) => {
  const apiService = useApi();
  const hasRun = useRef(false);
  const [timeLeft, setTimeLeft] = useState(30);

  //Timer
  useEffect(() => {
    let alreadyHandled = false;
    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { //only one second left
          if (!alreadyHandled) {
            alreadyHandled = true;
            handleTimerForChallengeRanOut();
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
      handleCheckPlacementActivePlayer_StartNewRound(activePlayer, activePlayerPlacement);
      hasRun.current = true;
    }
  }, []);

  const _confirmPlacement = function (_index: number) {
    // the timeline component can internally only throw the confirmPlacement event, if isPlacementMode is
    // true, but I still need to list the event in the component and call some method
  };

  const handleChallengeAccepted = () => {
    if (stompClient?.connected) {
      stompClient.publish({
        destination: "/app/challenge/accept",
        body: JSON.stringify({
          gameId,
          userId: sessionStorage.getItem("id"),
        }),
      });
    }
  };

  const handleTimerForChallengeRanOut = async () => {
    handleCheckPlacementActivePlayer_StartNewRound(
      activePlayer,
      activePlayerPlacement,
    );
  };

  const handleCheckPlacementActivePlayer_StartNewRound = async (
    activePlayer: Player,
    placement: number,
  ) => {
    if (songCard === null) return;
    //correct placement
    if (
      await checkCardPlacementCorrect(
        songCard,
        activePlayer.timeline,
        placement,
      )
    ) {
      message.success("Congratulation your placement is correct!");
      const body = {
        "songCard": songCard,
        "position": placement,
      };
      //update player == insert songCard into timeline
      try {
        await apiService.put(`/games/${gameId}/${activePlayer.userId}`, body);
      } catch (error) {
        if (error instanceof Error) {
          message.error(
            `Something went wrong during the inserting of the songCard into timeline of ${activePlayer.username}:\n${error.message}`,
          );
        } else {
          message.error(
            `An unknown error occurred during the inserting of the songCard into timeline of ${activePlayer.username}.`,
          );
          console.error(error);
        }
      }
    } //incorrect placement
    else {
      message.info("Wrong placement");
    }

    //(Start new Round) possibly call
    if (stompClient?.connected) {
      (stompClient as Client).publish({
        destination: "/app/userDeclinesChallenge",
        body: JSON.stringify({
          gameId: gameId ?? "",
          userId: userId ?? "",
        }),
      });
    }
  };

  const declineChallenge = async () => {
    if (stompClient?.connected) {
      (stompClient as Client).publish({
        destination: "/app/userDeclinesChallenge",
        body: JSON.stringify({
          gameId,
          userId: sessionStorage.getItem("id"),
        }),
      });
    }
  }

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
      {activePlayer.userId === userId ? (
        <p style={{marginTop:"20px", marginBottom:"10px"}}>Other players can now challenge your placement.</p>
      ) : (
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
        <div>
          <Button type="primary" onClick={handleChallengeAccepted}>
            Challenge
          </Button>
          <Button type="primary" onClick={declineChallenge}>
            Don't challenge
          </Button>
        </div>
      </>
      )}
    </div>
  );
};

export default Challenge;
