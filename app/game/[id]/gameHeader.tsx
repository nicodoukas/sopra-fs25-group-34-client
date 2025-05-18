import { Player } from "@/types/player";
import ExitButton from "./exitGame";

import { Button } from "antd";

import styles from "./gameHeader.module.css";

interface Props {
  player: Player;
  hostId: string | null;
  onBuyCard: () => void;
  onHandleExitGame: () => void;
}

export default function GameHeader(
  { player, hostId, onBuyCard, onHandleExitGame }: Props,
) {
  return (
    <header>
      <div className={styles.coinContainer}>
        <div>Coins: {player.coinBalance}/5</div>
        <Button onClick={onBuyCard} disabled={player.coinBalance < 3}>
          Buy a SongCard for 3 coins!
        </Button>
      </div>
      <div className={styles.buttonContainer}>
        <ExitButton
          playerId={player.userId}
          hostId={hostId}
          handleExitGame={onHandleExitGame}
        />
      </div>
    </header>
  );
}
