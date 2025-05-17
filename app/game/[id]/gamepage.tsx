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
import RankingList from "@/game/[id]/rankingList";

import { message } from "antd";

import { connectWebSocket } from "@/websocket/websocketService";
import { Client } from "@stomp/stompjs";

import styles from "./gamePage.module.css";
import "@/styles/game.css";

interface GuessProps {
  guessedTitle: string;
  guessedArtist: string;
}

const GamePage = (
  { onGameEnd }: {
    onGameEnd: () => void;
  },
) => {
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

  const handleWebSocketMessage = (websocket_Message: string) => {
    const parsedMessage = JSON.parse(websocket_Message);
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
      setGame(parsedMessage.data);
      const challengerId = parsedMessage.data.currentRound.challenger.userId;
      setStartChallenge(false);
      setChallengeTaken(true);
      if (challengerId.toString() === sessionStorage.getItem("id")) {
        message.success("You were the first to challenge");
      }
    }
    if (parsedMessage.event_type === "challenge-denied") {
      const challengerId = parsedMessage.data;
      setStartChallenge(false);
      if (challengerId.toString() === sessionStorage.getItem("id")) {
        message.warning("Someone was faster to challenge");
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
    await audio.play();

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

  const handleChallengerPlacement = (_placmentIndex: number) => {
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
        message.success("Congratulation, you guessed correct!");
        const updatedPlayer = await apiService.get<Player>(
          `/games/${gameId}/${userId}`,
        );
        setPlayer(updatedPlayer);
      } else {
        message.warning("Guess incorrect, try again.");
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(
          `Something went wrong during the guess:\n${error.message}`,
        );
      } else {
        message.error(
          "An unknown error occurred during the guess. Please try again later.",
        );
      }
      console.error(error);
    }
  };

  const handleBuyCard = async () => {
    try {
      const updatedPlayer = await apiService.put<Player>(
        `/games/${gameId}/buy`,
        player.userId,
      );
      setPlayer(updatedPlayer);
      message.success("SongCard purchased and added to your timeline!");
    } catch (error) {
      if (error instanceof Error) {
        message.error(`Error: ${error.message}`);
      } else {
        message.error("Unknown error while buying a SongCard.");
      }
      console.error(error);
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
        message.error(`Error: ${error.message}`);
      } else {
        message.error("Unknown error while leaving the game.");
      }
      console.error(error);
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
        setSongCard(gameData.currentRound?.songCard);
        const userId = sessionStorage.getItem("id");
        if (!playerIsLeaving) {
          const playerData = await apiService.get<Player>(
            `/games/${gameId}/${userId}`,
          );
          setPlayer(playerData);
        }
      } catch (error) {
        message.error("Failed to fetch game or player data.");
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
      {startChallenge && !roundOver
        && (
          <>
            <Challenge
              activePlayer={game.currentRound.activePlayer}
              songCard={songCard}
              gameId={gameId}
              gameName={game?.gameName || "{gameName}"}
              activePlayerPlacement={game.currentRound.activePlayerPlacement}
              stompClient={stompClient}
              userId={player.userId}
              checkCardPlacementCorrect={checkCardPlacementCorrect}
              allPlayers={game.players}
            />
          </>
        )}
        {challengeTaken && !roundOver && (
          player.userId === game.currentRound.activePlayer.userId
          ? <p>The other players can now challenge your placement</p>
          : player.userId === game.currentRound.challenger?.userId
          ? (
            <ChallengeAccepted
              gameName={game?.gameName || "{gameName}"}
              activePlayerName={game.currentRound?.activePlayer?.username}
              activePlayersTimeline={game.currentRound.activePlayer.timeline}
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
            gameId={gameId}
            roundNr={game.currentRound?.roundNr}
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
