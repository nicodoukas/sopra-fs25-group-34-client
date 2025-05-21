import React from "react";

import Timeline from "./timeline";
import { SongCard } from "@/types/songcard";
import {Player} from "@/types/player";
import {message } from "antd";

interface Props {
  gameName: string;
  userId: string | null;
  challenger: Player | null;
  activePlayerName: string | null;
  activePlayersTimeline: SongCard[];
  activePlayerPlacement: number;
  handleChallengerPlacement: (index: number) => void;
}

const ChallengeAccepted: React.FC<Props> = ({
  gameName,
  challenger,
  userId,
  activePlayerName,
  activePlayersTimeline,
  activePlayerPlacement,
  handleChallengerPlacement,
}) => {
  const confirmPlacement = (index: number) => {
    if (index == activePlayerPlacement){
    message.warning("You need to place the Songcard first");
    return;
    }
    handleChallengerPlacement(index);
  };
  return (
    <div className="beige-card">
      <h2 style={{ fontSize: "1.5rem", marginBottom: "0px" }}>{gameName}</h2>
      <h3>Challenge phase</h3>
      {userId === challenger?.userId ? (
      <>
        <Timeline
          title={"where would you place the song in " + activePlayerName +
            "'s timeline?"}
          timeline={activePlayersTimeline}
          isPlaying={false}
          isPlacementMode={true}
          confirmPlacement={confirmPlacement}
          activePlayerPlacement={activePlayerPlacement}
          challenge={true}
        />
      </>
      ) : (
      <>
        <p>
          {challenger?.username}{" "}
          accepted the challenge and is now placing the card
        </p>
      </>
      )}
    </div>
  );
};

export default ChallengeAccepted;
