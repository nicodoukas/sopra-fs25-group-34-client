import React, { useEffect } from "react";
import { SongCard } from "@/types/songcard";
import { Client } from "@stomp/stompjs";

interface Props{
    songCard: SongCard | null;
    stompClient: Client | null;
    gameId: string;
}
const EndRound: React.FC<Props> = ({
  songCard,
  stompClient,
  gameId,
}) => {
    if (!songCard) {
        return <div>No song data available.</div>;
      }
    useEffect(() => {
        const timer = setTimeout(() => {
            if (stompClient?.connected) {
              (stompClient as Client).publish({
                destination: "/app/startNewRound",
                body: gameId ?? "",
              });
            }
        }, 5000);
      
        return () => clearTimeout(timer); // cleanup if component unmounts early
    
    }, [stompClient, gameId]);
      
    return (
    <div className="beige-card" style={{ textAlign: "center", padding: "2rem" }}>
        <h2>🎵 Round Summary</h2>
        <p><strong>Title:</strong> {songCard.title}</p>
        <p><strong>Artist:</strong> {songCard.artist}</p>
        <p><strong>Release Year:</strong> {songCard.year}</p>
    </div>)

};
  
export default EndRound;
  