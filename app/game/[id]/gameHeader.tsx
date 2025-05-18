import { useState } from "react";

import { Player } from "@/types/player";
import ExitButton from "./exitGame";
import RankingList from "./rankingList";

import { Button, Modal } from "antd";

import styles from "./gameHeader.module.css";

interface Props {
  player: Player;
  players: Player[];
  hostId: string | null;
  onBuyCard: () => void;
  onHandleExitGame: () => void;
}

export default function GameHeader(
  { player, players, hostId, onBuyCard, onHandleExitGame }: Props,
) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <header>
      <div className={styles.coinContainer}>
        <div>Coins: {player.coinBalance}/5</div>
        <Button onClick={onBuyCard} disabled={player.coinBalance < 3}>
          Buy a SongCard for 3 coins!
        </Button>
        <Button onClick={showModal}>Ranking</Button>
      </div>
      <div className={styles.buttonContainer}>
        <ExitButton
          playerId={player.userId}
          hostId={hostId}
          handleExitGame={onHandleExitGame}
        />
      </div>
      <Modal
        title="Current Ranking"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <RankingList players={players} playerId={player.userId} />
      </Modal>
    </header>
  );
}
