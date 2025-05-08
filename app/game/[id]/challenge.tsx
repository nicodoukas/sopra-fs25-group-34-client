import React, {useEffect, useState} from "react";
import { SongCard } from "@/types/songcard";
import Timeline from "./timeline";

import { Button, message } from "antd";
import { Client } from "@stomp/stompjs";
import {Player} from "@/types/player";
import {useApi} from "@/hooks/useApi";

interface Props {
  activePlayer: Player;
  songCard: SongCard | null;
  gameId: string;
  gameName: string;
  activePlayerPlacement: number;
  challengeHandeled: () => void;
  stompClient: Client | null;
  checkCardPlacementCorrect: (songCard: SongCard, timeline: SongCard[], placement: number) => Promise<boolean>;
}
//TODO: maybe I can pass the whole active player

const Challenge: React.FC<Props> = ({
  activePlayer,
  songCard,
  gameId,
  gameName,
  activePlayerPlacement,
  challengeHandeled,
  stompClient,
  checkCardPlacementCorrect,
}) => {
  const [messageAPI, contextHolder] = message.useMessage();
  const apiService = useApi();
  const [timeLeft, setTimeLeft] = useState(30);

  //Timer
  useEffect(() => {
    let alreadyHandled = false;
    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { //only one second left
          if (!alreadyHandled) {
            alreadyHandled = true;
            handleChallengeDeclined();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000); //every second (1s = 1000ms)

    return () => clearInterval(countdown);
  }, []);

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
    handleCheckPlacementActivePlayer_StartNewRound(activePlayer, activePlayerPlacement);
  };

  const handleCheckPlacementActivePlayer_StartNewRound = async (activePlayer: Player, placement: number) => {
    if (songCard === null){return;}
    //correct placement
    if (await checkCardPlacementCorrect(songCard, activePlayer.timeline, placement)) {
      messageAPI.success("Congratulation your placement is correct!");
      const body = {
        "songCard": songCard,
        "position": placement
      }
      //update player == insert songCard into timeline
      try {
        await apiService.put(`/games/${gameId}/${activePlayer.userId}`, body);
      } catch (error) {
        if (error instanceof Error) {
          alert(`Something went wrong during the inserting of the songCard into timeline of ${activePlayer.username}:\n${error.message}`);
          console.error(error);
        } else {
          console.error(`An unknown error occurred during the inserting of the songCard into timeline of ${activePlayer.username}.`);
        }
      }
    }
    //incorrect placement
    else {
      messageAPI.info("Wrong placement");
    }
    //Start new Round
    if (stompClient?.connected) {
      (stompClient as Client).publish({
        destination: "/app/startNewRound",
        body: gameId ?? "",
      });
    }
  }

  const toRemoveButton = async () => {
    challengeHandeled();
  };

  return (
    <div className="beige-card" style={{display:"flex", justifyContent:"center", alignItems:"center", flexDirection:"column"}}>
      {contextHolder}
      <h2 style={{ fontSize: "1.5rem", marginBottom: "0px" }}>{gameName}</h2>
      <h3>Challenge phase</h3>
      <p style={{fontWeight: "bold", marginTop: "1rem"}}>
        Time left to challenge: {timeLeft} seconds
      </p>
      <Timeline
        title={activePlayer.username + "'s placement:"}
        timeline={activePlayer.timeline}
        songCard={songCard}
        gameId={gameId}
        isPlaying={false}
        isPlacementMode={false}
        confirmPlacement={randomMethod}
        activePlayerPlacement={activePlayerPlacement}
      />
      <div>
        <Button type="primary" onClick={handleChallengeAccepted}>
          Challenge
        </Button>
        <Button type="primary" onClick={handleChallengeDeclined}>
          Don't challenge
        </Button>
      </div>

      <Button onClick={toRemoveButton}>Simulate challenge beeing over</Button>
    </div>
  );
};

export default Challenge;
