import React from "react";

import Timeline from "./timeline";
import { SongCard } from "@/types/songcard";

interface Props {
  gameName: string;
  activePlayerName: string | null;
  activePlayersTimeline: SongCard[];
  songCard: SongCard | null;
  gameId: string;
  activePlayerPlacement: number;
  handleChallengerPlacement: (index: number) => void;
}

const ChallengeAccepted: React.FC<Props> = ({
  gameName,
  activePlayerName,
  activePlayersTimeline,
  songCard,
  gameId,
  activePlayerPlacement,
  handleChallengerPlacement,
}) => {
  const confirmPlacement = async (index: number) => {
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
        songCard={songCard}
        gameId={gameId}
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
