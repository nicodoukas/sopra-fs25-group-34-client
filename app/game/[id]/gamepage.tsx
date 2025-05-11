"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Game } from "@/types/game";
import { Player } from "@/types/player";
import { SongCard } from "@/types/songcard";

import GameHeader from "./gameHeader";
import Guess from "./guess";
import PlayButton from "./playButton";
import Timeline from "./timeline";
import ExitButton from "./exitGame";
import Challenge from "./challenge";
import ChallengeAccepted from "./challengeAccepted";
import EndRound from "./endRound";


import "@ant-design/v5-patch-for-react-19";
import { message } from "antd";

import { connectWebSocket } from "@/websocket/websocketService";
import { Client } from "@stomp/stompjs";

import styles from "./gamePage.module.css";
import "@/styles/game.css";
import RankingList from "@/game/[id]/rankingList";

interface GuessProps {
  guessedTitle: string;
  guessedArtist: string;
}

const GamePage = (
  { onGameEnd }: {
    onGameEnd: () => void;
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
  const [songCard, setSongCard] = useState<SongCard | null>({} as SongCard); // SongCard of currentRound
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const gameRef = useRef<Game | null>(null);
  const [guessed, setGuessed] = useState<boolean>(false);
  const [triggerUseEffect, setTriggerUseEffect] = useState<number>(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [playerIsLeaving, setPlayerIsLeaving] = useState(false);
  const [startChallenge, setStartChallenge] = useState<boolean>(false);
  const [challengeTaken, setChallengeTaken] = useState<boolean>(false);
  const [roundOver, setRoundOver] = useState<boolean>(false);

  const handleWebSocketMessage = (message: string) => {
    const parsedMessage = JSON.parse(message);
    if (parsedMessage.event_type === "play-song") {
      playAudio();
    }
    if (parsedMessage.event_type === "start-new-round") {
      setRoundOver(false);
      setGuessed(false);
      setAudioState(true);
      setIsPlaying(false);
      setTriggerUseEffect((prev) => prev + 1);
      setStartChallenge(false);
    }
    if (parsedMessage.event_type == "update-game") {
      setTriggerUseEffect((prev) => prev + 1);
    }
    if (parsedMessage.event_type == "delete-game") {
      onGameEnd();
    }
    if (parsedMessage.event_type === "start-challenge") {
      setGame(parsedMessage.data);
      setStartChallenge(true);
    }
    if (parsedMessage.event_type === "challenge-accepted") {
      console.log("in websocket if if if");
      setGame(parsedMessage.data);
      const challengerId = parsedMessage.data.currentRound.challenger.userId;
      setStartChallenge(false);
      setChallengeTaken(true);
      if (challengerId.toString() === sessionStorage.getItem("id")) {
        messageAPI.success("You were the first to challenge");
      }
    }
    if (parsedMessage.event_type === "challenge-denied") {
      const challengerId = parsedMessage.data;
      setStartChallenge(false);
      if (challengerId.toString() === sessionStorage.getItem("id")) {
        messageAPI.warning("Someone was faster to challenge");
      }
    }
    if (parsedMessage.event_type === "end-round"){
      setRoundOver(true);
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

  const setActivePlayerPlacementAndStartChallengePhase = (index: number) => {
    if (stompClient?.connected) {
      (stompClient as Client).publish({
        destination: "/app/startchallenge",
        body: JSON.stringify({
          gameId,
          placement: index,
        }),
      });
    }
  };


  const handleChallengerPlacement = (placmentIndex: number) => {
    //TODO: call API service to set challengers placement
    //then trigger evaluation
    setChallengeTaken(false);
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
      } else {
        await apiService.delete(`/games/${gameId}/${player.userId}`);
        setPlayerIsLeaving(true);
        if (stompClient?.connected) {
          (stompClient as Client).publish({
            destination: "/app/updategame",
            body: gameId ?? "",
          });
        }
        router.push("/overview");
      }
    } catch (error) {
      if (error instanceof Error) {
        messageAPI.error(`Error: ${error.message}`);
      } else {
        messageAPI.error("Unknown error while leaving the game.");
      }
    }
  };

  //returns true if correct, false otherwise
  const checkCardPlacementCorrect = async (
    songCard: SongCard,
    timeline: SongCard[],
    placement: number,
  ) => {
    const year = songCard?.year;
    let yearBefore = -1;
    let yearAfter = 3000;
    if (placement > 0) yearBefore = timeline[placement - 1].year;
    if (placement < timeline.length) yearAfter = timeline[placement].year;
    return (yearBefore <= year && yearAfter >= year);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gameData = await apiService.get<Game>(`/games/${gameId}`);
        setGame(gameData);
        console.log("This is the game: ", gameData);
        setSongCard(gameData.currentRound?.songCard);
        const userId = sessionStorage.getItem("id");
        if (!playerIsLeaving) {
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
      {startChallenge
        ? (
          player.userId === game.currentRound.activePlayer.userId
            ? <p>The other players can now challenge your placement</p>
            : (
              <>
                <Challenge
                  activePlayer={game.currentRound.activePlayer}
                  songCard={songCard}
                  gameId={gameId}
                  gameName={game?.gameName || "{gameName}"}
                  activePlayerPlacement={game.currentRound
                    .activePlayerPlacement}
                  stompClient={stompClient}
                  userId={player.userId}
                  checkCardPlacementCorrect={checkCardPlacementCorrect}
                />
              </>
            )
        )
        : <></>}
        {challengeTaken && (
          player.userId === game.currentRound.activePlayer.userId
          ? <p>The other players can now challenge your placement</p>
          : player.userId === game.currentRound.challenger?.userId
          ? (
            <ChallengeAccepted
              gameName={game?.gameName || "{gameName}"}
              activePlayerName={game.currentRound?.activePlayer?.username}
              activePlayersTimeline={game.currentRound.activePlayer.timeline}
              songCard={songCard}
              gameId={gameId}
              activePlayerPlacement={game.currentRound.activePlayerPlacement}
              handleChallengerPlacement={handleChallengerPlacement}
            />
          )
          : (
            <p>
              {game.currentRound.challenger?.username}{" "}
              accepted the challenge and is now placing the card
            </p>
          )
      )}
      {!startChallenge && !challengeTaken && !roundOver
        ? (
          <>
            <RankingList players={game.players} playerId={player.userId} />
            <div className="beige-card" style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0px" }}>
                {game?.gameName || "{gameName}"}
              </h2>
              <h3>{game.currentRound.activePlayer.username}'s turn</h3>
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
              <Timeline
                title="Your Timeline"
                timeline={player.timeline}
                songCard={songCard}
                gameId={gameId}
                isPlaying={isPlaying}
                isPlacementMode={player.userId ==
                  game.currentRound?.activePlayer?.userId}
                confirmPlacement={setActivePlayerPlacementAndStartChallengePhase}
                activePlayerPlacement={null}
                challenge={false}
              />
            </div>
            <Guess guessed={guessed} onHandleGuess={handleGuess}></Guess>
          </>
        )
        : <></>}
      {roundOver
        ? (
          <EndRound
          songCard={songCard}
          stompClient={stompClient}
          gameId = {gameId}
          />
        )
        : <></>}
      <ExitButton
        playerId={player.userId}
        hostId={game.host?.userId ?? null}
        handleExitGame={handleExitGame}
      />
    </div>
  );
};

export default GamePage;
