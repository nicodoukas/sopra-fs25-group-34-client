import { Player } from "@/types/player";

import { Button } from "antd";

import styles from "./gameHeader.module.css";

interface Props {
  player: Player;
  onBuyCard: () => void;
}

export default function GameHeader({ player, onBuyCard }: Props) {
  return (
    <header>
      <div className={styles.coinContainer}>
        <div>Coins: {player.coinBalance}/5</div>
        <Button onClick={onBuyCard} disabled={player.coinBalance < 3}>
          Buy a SongCard for 3 coins!
        </Button>
      </div>
    </header>
  );
}
