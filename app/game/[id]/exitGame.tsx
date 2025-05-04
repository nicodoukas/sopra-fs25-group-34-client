import {Button} from "antd";

interface Props {
  playerId: string | null;
  hostId: string | null;
  handleExitGame: () => void;
}

export default function ExitButton({playerId,hostId,handleExitGame,}: Props,) {

  return (
    <div>
      {playerId === hostId ? (
      <div className="exitGameContainer">
        <Button onClick={handleExitGame}>End Game</Button>
      </div>
      ) : (
      <div className="exitGameContainer">
        <Button onClick={handleExitGame}>Leave Game</Button>
      </div>
      )}
    </div>
  );
}
