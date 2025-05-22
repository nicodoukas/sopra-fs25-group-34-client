import React from "react";
import { SongCard } from "@/types/songcard";
import { Client } from "@stomp/stompjs";

interface Props{
    songCard: SongCard | null;
    stompClient: Client | null;
    gameId: string;
    roundNr: number;
    playerId: string | null;
    activePlayerId: string | null;
}
const EndRound: React.FC<Props> = ({
  songCard,
  stompClient,
  gameId,
  roundNr,
  activePlayerId,
  playerId,
}) => {
  const isActivePlayer = playerId === activePlayerId;

  const handleStartNextRound = () => {
    if (stompClient?.connected) {
      stompClient.publish({
        destination: "/app/startNewRound",
        body: JSON.stringify({
          gameId: gameId,
          roundNr: roundNr,
        }),
      });
      console.log("Start new round triggered!");
    } else {
      console.warn("STOMP client is not connected.");
    }
  };

  if (!songCard) {
    return <div>No song data available.</div>;
  }
      
    return (
      <div className="beige-card" style={{ textAlign: "center", padding: "2rem" }}>
        <h2>🎵 Round Summary</h2>
        <p><strong>Title:</strong> {songCard.title}</p>
        <p><strong>Artist:</strong> {songCard.artist}</p>
        <p><strong>Release Year:</strong> {songCard.year}</p>
        {isActivePlayer && (<button
        onClick={handleStartNextRound}
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded mt-4"
        >
          Start Next Round
        </button>
        )}
      </div>
    )
};
  
export default EndRound;
  