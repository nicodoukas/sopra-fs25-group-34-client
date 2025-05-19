import React, { useEffect } from "react";
import { SongCard } from "@/types/songcard";
import { Client } from "@stomp/stompjs";

interface Props{
    songCard: SongCard | null;
    stompClient: Client | null;
    gameId: string;
    roundNr: number;
}
const EndRound: React.FC<Props> = ({
  songCard,
  stompClient,
  gameId,
  roundNr,
}) => {

    useEffect(() => {
        console.log("This is the roundNr:", roundNr)
        const timer = setTimeout(() => {
            if (stompClient?.connected) {
              (stompClient as Client).publish({
                destination: "/app/startNewRound",
                body: JSON.stringify({
                  gameId: gameId,
                  roundNr: roundNr,}),
              });
            }
        }, 5000);
      
        return () => clearTimeout(timer); // cleanup if component unmounts early
    
    }, [stompClient, gameId, roundNr]);

  if (!songCard) {
    return <div>No song data available.</div>;
  }
      
    return (
      <div className="beige-card" style={{ textAlign: "center", padding: "2rem" }}>
        <h2>🎵 Round Summary</h2>
        <p><strong>Title:</strong> {songCard.title}</p>
        <p><strong>Artist:</strong> {songCard.artist}</p>
        <p><strong>Release Year:</strong> {songCard.year}</p>
      </div>
    )
};
  
export default EndRound;
  