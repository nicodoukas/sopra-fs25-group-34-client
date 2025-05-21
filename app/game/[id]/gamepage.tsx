"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useApi } from "@/hooks/useApi";
import useSessionStorage from "@/hooks/useSessionStorage";
import { Game } from "@/types/game";
import { Player } from "@/types/player";
import { SongCard } from "@/types/songcard";

import GameHeader from "./gameHeader";
import Guess from "./guess";
import PlayButton from "./playButton";
import Timeline from "./timeline";
import Challenge from "./challenge";
import ChallengeAccepted from "./challengeAccepted";
import EndRound from "./endRound";

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
  const playerRef = useRef<Player | null>(null);
  const songcardRef = useRef<SongCard | null>(null);
  const [guessed, setGuessed] = useState<boolean>(false);
  const [triggerUseEffect, setTriggerUseEffect] = useState<number>(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [playerIsLeaving, setPlayerIsLeaving] = useState(false);
  const [startChallenge, setStartChallenge] = useState<boolean>(false);
  const [challengeTaken, setChallengeTaken] = useState<boolean>(false);
  const [roundOver, setRoundOver] = useState<boolean>(false);
  const [isGameMember, setIsGameMember] = useState<boolean | null>(null);
  const hasHandledMissingGame = useRef(false);

  const {
    value: id,
  } = useSessionStorage<string>("id", "");

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

  const fetchPlayer = async () => {
      try {
        const userId = sessionStorage.getItem("id");
        if (!playerIsLeaving) {
          const playerData = await apiService.get<Player>(
            `/games/${gameId}/${userId}`,
          );
          setPlayer(playerData);
        }
      } catch (error) {
        message.error("Failed to load player data.");
        console.error("Error fetching data:", error);
      }
  };

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
      fetchPlayer();
      setTriggerUseEffect((prev) => prev + 1);
      setStartChallenge(false);
      setChallengeTaken(false);
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
    if (parsedMessage.event_type === "end-round") {
      handleCheckPlacementActivePlayerStartNewRound()
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
  const handleCheckPlacementActivePlayerStartNewRound = async () => {
      const currentGame = gameRef.current;
      const currentPlayer = playerRef.current;
      if (!currentGame || !currentPlayer || !songcardRef.current) {
        console.warn("Missing game or player data");
        return;
      }
      if (currentGame.currentRound.activePlayer.userId !== currentPlayer.userId) return;
      if (songCard === null) return;
      const activePlayer = currentGame.currentRound.activePlayer
      const placement = currentGame.currentRound.activePlayerPlacement
      const result = await checkCardPlacementCorrect(songcardRef.current, activePlayer.timeline, placement)
      console.log("This is the check placement:", result)
      //correct placement
      if (
        result
      ) {
        message.success("Congratulation your placement is correct!");
        const body = {
          "songCard": songcardRef.current,
          "position": placement,
        };
        //update player == insert songCard into timeline
        try {
          await apiService.put(`/games/${gameId}/${activePlayer.userId}`, body);
          console.log("timeline gets updated")
        } catch (error) {
          if (error instanceof Error) {
            message.error(
              `Something went wrong during the inserting of the songCard into timeline of ${activePlayer.username}:\n${error.message}`,
            );
          } else {
            message.error(
              `An unknown error occurred during the inserting of the songCard into timeline of ${activePlayer.username}.`,
            );
            console.error(error);
          }
        }
      } //incorrect placement
      else {
        message.info("Wrong placement");
      }
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

  const handleChallengerPlacement = async(_placmentIndex: number) => {
    if (!gameRef.current || !songcardRef.current || !playerRef.current) {
        console.warn("Missing game or player data");
        return;
      }
    const result = await checkCardPlacementCorrect(songcardRef.current, gameRef.current.currentRound.activePlayer.timeline, _placmentIndex)
    //correct placement
      if (
        result
      ) {
        message.success("Congratulation your placement is correct!");
        const body = {
          "songCard": songcardRef.current,
          "position": _placmentIndex,
        };
        //update player == insert songCard into timeline
        try {
          await apiService.put(`/games/${gameId}/${playerRef.current.userId}`, body);
          console.log("timeline gets updated")
        } catch (error) {
          if (error instanceof Error) {
            message.error(
              `Something went wrong during the inserting of the songCard into timeline of ${playerRef.current.username}:\n${error.message}`,
            );
          } else {
            message.error(
              `An unknown error occurred during the inserting of the songCard into timeline of ${playerRef.current.username}.`,
            );
            console.error(error);
          }
        }
      } //incorrect placement
      else {
        message.info("Wrong placement");
      }
    // send message to websocket to show end-round screen
    if (stompClient?.connected) {
      (stompClient as Client).publish({
        destination: "/app/userAcceptsChallenge",
        body: gameId ?? ""
      });
    }
    setChallengeTaken(false);
  }

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

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const gameData = await apiService.get<Game>(`/games/${gameId}`);
        setGame(gameData);
        setSongCard(gameData.currentRound?.songCard);
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message.includes("404: Game with ID") &&
            !hasHandledMissingGame.current
          ) {
            hasHandledMissingGame.current = true;
            setTimeout(() => {
              message.warning(
                "There exists no game with this id, please create a lobby to start a game.",
              );
            }, 200);
            router.push("/overview");
          }
        } else {
          message.error("Failed to load game data.");
          console.error("Error fetching data:", error);
        }
      }
    };
    fetchGame();
  }, [apiService, gameId, triggerUseEffect]);

  useEffect(() => {
    if (isGameMember) {
      fetchPlayer();
    }
  }, [apiService, gameId, triggerUseEffect, isGameMember]);

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
  useEffect(() => {
    playerRef.current = player;
  }, [player]);
  useEffect(() => {
    songcardRef.current = songCard;
  }, [songCard]);



  useEffect(() => {
    if (!game.players) return;
    if (isGameMember != null) return;
    if (game.players.some((member) => member.userId === id)) {
      setIsGameMember(true);
    } else {
      setTimeout(() => {
        message.info("This page is only accessible to members of the game");
      }, 200);
      setIsGameMember(false);
      router.push("/overview");
    }
  }, [router, game, id]);

  if (!isGameMember) {
    return <div>Loading...</div>;
  }

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
    <>
      <GameHeader
        player={player}
        players={game.players}
        hostId={game.host?.userId ?? null}
        onBuyCard={handleBuyCard}
        onHandleExitGame={handleExitGame}
      />
      <div className={styles.gameContainer}>
        {startChallenge && !roundOver &&
          (
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
          <ChallengeAccepted
            gameName={game?.gameName || "{gameName}"}
            challenger={game.currentRound?.challenger}
            userId={player.userId}
            activePlayerName={game.currentRound?.activePlayer?.username}
            activePlayersTimeline={game.currentRound.activePlayer.timeline}
            activePlayerPlacement={game.currentRound.activePlayerPlacement}
            handleChallengerPlacement={handleChallengerPlacement}
          />
        )}
        {!startChallenge && !challengeTaken && !roundOver
          ? (
            <>
              <div className="beige-card" style={{ textAlign: "center" }}>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "0px" }}>
                  {game?.gameName || "{gameName}"}
                </h2>
                <h3>{game.currentRound.activePlayer.username}&#39;s turn</h3>
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
      </div>
    </>
  );
};

export default GamePage;
