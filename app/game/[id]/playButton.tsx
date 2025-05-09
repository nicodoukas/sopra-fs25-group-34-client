import { Button } from "antd";

interface Props {
  songUrl: string | undefined;
  playerId: string | null;
  activePlayerId: string | null;
  isPlaying: boolean;
  audioState: boolean;
  audioUnlocked: boolean;
  handlePlayButtonClick: () => void;
  unlockAudio: () => void;
}

export default function PlayButton(
  {
    songUrl,
    playerId,
    activePlayerId,
    isPlaying,
    audioState,
    audioUnlocked,
    handlePlayButtonClick,
    unlockAudio,
  }: Props,
) {
  return (
    <div className="playButtonContainer">
      {songUrl &&
        playerId == activePlayerId && (
        <div
          className={`playButton ${isPlaying ? "playing" : ""}`}
          onClick={audioState && !isPlaying ? handlePlayButtonClick : undefined}
          style={{ pointerEvents: audioState ? "auto" : "none" }}
        >
          <img
            src="/img/playsymbol.png"
            alt="Play"
            className="playIcon"
          />
        </div>
      )}
      {!audioUnlocked &&
        playerId != activePlayerId && (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <Button onClick={unlockAudio}>Enable Audio</Button>
        </div>
      )}
    </div>
  );
}
