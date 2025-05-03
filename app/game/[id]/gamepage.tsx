"use client";

import React, { useEffect, useRef, useState } from "react";
import {useRouter, useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Game } from "@/types/game";
import { Player } from "@/types/player";
import { SongCard } from "@/types/songcard";
import GameHeader from "./gameHeader";
import Guess from "./guess";
import PlayButton from "./playButton";
import Timeline from "./timeline";
import ExitButton from "./exitGame";

import "@ant-design/v5-patch-for-react-19";
import { message, Typography } from "antd";

import { connectWebSocket } from "@/websocket/websocketService";
import { Client } from "@stomp/stompjs";

import styles from "./gamePage.module.css";
import "@/styles/game.css";

const { Text } = Typography;

interface GuessProps {
  guessedTitle: string;
  guessedArtist: string;
}

const GamePage = (
  { onGameEnd, onStartChallenge }: {
    onGameEnd: () => void;
    onStartChallenge: () => void;
  },
) => {
  const [messageAPI, contextHolder] = message.useMessage();
  const apiService = useApi();
  const router = useRouter();
  const params = useParams();
  const gameId = Array.isArray(params.id) ? params.id[0] : params.id!;
  const [game, setGame] = useState<Game>({} as Game);
  const [player, setPlayer] = useState<Player>({} as Player);
  const [audioState, setAudioState] = useState<boolean>(true); //True if song not yet played, false otherwise
  const [isPlaying, setIsPlaying] = useState<boolean>(false); //True if song is currently playing
  const [placement, setPlacement] = useState<number | null>(null); //position of placement of SongCard
  const [songCard, setSongCard] = useState<SongCard | null>({} as SongCard); // SongCard of currentRound
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const gameRef = useRef<Game | null>(null);
  const [guessed, setGuessed] = useState<boolean>(false);
  const [triggerUseEffect, setTriggerUseEffect] = useState<number>(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [playerIsLeaving, setPlayerIsLeaving] = useState(false);

  const handleWebSocketMessage = (message: string) => {
    const parsedMessage = JSON.parse(message);
    if (parsedMessage.event_type === "play-song") {
      playAudio();
    }
    if (parsedMessage.event_type === "start-new-round") {
      setGuessed(false);
      setAudioState(true);
      setPlacement(null);
      setIsPlaying(false);
      setTriggerUseEffect((prev) => prev + 1);
    }
    if (parsedMessage.event_type == "update-game"){
      setTriggerUseEffect((prev) => prev + 1)
    }
    if (parsedMessage.event_type == "delete-game"){
      onGameEnd();
    }
    if (parsedMessage.event_type === "start-challenge") {
      onStartChallenge();
    }
  };

  const unlockAudio = () => {
    const silentAudio = new Audio();
    silentAudio.play().catch(() => {
    });
    setAudioUnlocked(true);
  };

  const playAudio = async (): Promise<void> => {
    setIsPlaying(true);
    const audio = new Audio(gameRef.current?.currentRound.songCard?.songURL);
    audio.volume = 0.8;
    audio.play();

    audio.onended = () => {
      setAudioState(false);
      setIsPlaying(false);
    };
  };

  const placementConfirmed = async () => {
    //startchallenge
    if (stompClient?.connected) {
      (stompClient as Client).publish({
        destination: "/app/startchallenge",
        body: gameId ?? "",
      });
    }
  };

  const handleGuess = async (values: GuessProps) => {
    const body = {
      ...values,
      player: player,
    };
    const userId = sessionStorage.getItem("id");
    try {
      const correct = await apiService.post<boolean>(
        `/games/${gameId}/${userId}/guess`,
        body,
      );
      if (correct) {
        setGuessed(true);
        messageAPI.success("Congratulation, you guessed correct!");
        const updatedPlayer = await apiService.get<Player>(
          `/games/${gameId}/${userId}`,
        );
        setPlayer(updatedPlayer);
      } else {
        messageAPI.warning("Guess incorrect, try again.");
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the guess:\n${error.message}`);
        console.error(error);
      } else {
        console.error("An unknown error occurred during guess.");
      }
    }
  };

  const handleBuyCard = async () => {
    try {
      const updatedPlayer = await apiService.put<Player>(
        `/games/${gameId}/buy`,
        player.userId,
      );
      setPlayer(updatedPlayer);
      messageAPI.success("SongCard purchased and added to your timeline!");
    } catch (error) {
      if (error instanceof Error) {
        messageAPI.error(`Error: ${error.message}`);
      } else {
        messageAPI.error("Unknown error while buying a SongCard.");
      }
    }
  };

  const handleExitGame = async () => {
    try {
      if (player.userId == game.host?.userId) {
        if (stompClient?.connected) {
          (stompClient as Client).publish({
            destination: "/app/deleteGame",
            body: gameId ?? "",
          });
        }
      }
      else {
        await apiService.delete(`/games/${gameId}/${player.userId}`);
        setPlayerIsLeaving(true)
        if (stompClient?.connected) {
          (stompClient as Client).publish({
            destination: "/app/updategame",
            body: gameId ?? "",
          });
        }
        router.push("/overview")
      }
    } catch (error) {
      if (error instanceof Error) {
        messageAPI.error(`Error: ${error.message}`);
      } else {
        messageAPI.error("Unknown error while leaving the game.");
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gameData = await apiService.get<Game>(`/games/${gameId}`);
        setGame(gameData);
        console.log("This is the game: ", gameData);
        setSongCard(gameData.currentRound?.songCard);
        const userId = sessionStorage.getItem("id");
        if (!playerIsLeaving){
          const playerData = await apiService.get<Player>(
            `/games/${gameId}/${userId}`,
          );
          setPlayer(playerData);
          console.log("This is the player: ", playerData);
        }
      } catch (error) {
        alert("Failed to fetch game or player data.");
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [apiService, gameId, triggerUseEffect]);

  useEffect(() => {
    const client = connectWebSocket(handleWebSocketMessage, gameId);
    setStompClient(client);

    return () => {
      client?.deactivate();
    };
  }, []);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const handlePlayButtonClick = () => {
    if (stompClient?.connected) {
      (stompClient as Client).publish({
        destination: "/app/play",
        body: gameId ?? "",
      });
    }
  };

  if (!player || !game?.currentRound?.activePlayer) {
    return <div style={{ color: "white" }}>Loading...</div>;
  }

  return (
    <div className={styles.gameContainer}>
      <GameHeader
        player={player}
        onBuyCard={handleBuyCard}
        onGameEnd={onGameEnd}
      />
      {contextHolder}
      <div className="beige-card" style={{ textAlign: "center" }}>
        <h2>{game?.gameName || "{gameName}"}</h2>
        <PlayButton
          songUrl={songCard?.songURL}
          playerId={player.userId}
          activePlayerId={game.currentRound.activePlayer.userId}
          isPlaying={isPlaying}
          audioState={audioState}
          audioUnlocked={audioUnlocked}
          handlePlayButtonClick={handlePlayButtonClick}
          unlockAudio={unlockAudio}
        >
        </PlayButton>
        <div className="songCardContainer">
          {placement == null &&
            player.userId == game.currentRound.activePlayer.userId && (
            <div className="songCard">
              <Text strong style={{ fontSize: "30px" }}>?</Text>
            </div>
          )}
        </div>
        {
          /*         //TODO: for trying out show only timeline for active player
        so that i can remove the active player checks from in there */
        }
        {player.userId ==
            game?.currentRound.activePlayer.userId
          ? (
            <Timeline
              timeline={player.timeline}
              isPlaying={isPlaying}
              songCard={songCard}
              gameId={gameId}
              placementConfirmed={placementConfirmed}
            />
          )
          : <p>not active player</p>}
      </div>
      <Guess guessed={guessed} onHandleGuess={handleGuess}></Guess>
      <ExitButton playerId={player.userId} hostId={game.host?.userId ?? null} handleExitGame={handleExitGame}/>
    </div>
  );
};

export default GamePage;
