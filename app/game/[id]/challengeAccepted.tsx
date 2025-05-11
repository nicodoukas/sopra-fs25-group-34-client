import React from "react";

import Timeline from "./timeline";
import { SongCard } from "@/types/songcard";

interface Props {
  gameName: string;
  activePlayerName: string | null;
  activePlayersTimeline: SongCard[];
  activePlayerPlacement: number;
  handleChallengerPlacement: (index: number) => void;
}

const ChallengeAccepted: React.FC<Props> = ({
  gameName,
  activePlayerName,
  activePlayersTimeline,
  activePlayerPlacement,
  handleChallengerPlacement,
}) => {
  const confirmPlacement = (index: number) => {
    handleChallengerPlacement(index);
  };
  return (
    <div className="beige-card">
      <h2 style={{ fontSize: "1.5rem", marginBottom: "0px" }}>{gameName}</h2>
      <h3>Challenge phase</h3>
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
    </div>
  );
};

export default ChallengeAccepted;
