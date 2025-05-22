"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import useSessionStorage from "@/hooks/useSessionStorage";
import withAuth from "@/utils/withAuth";
import Header from "@/components/header";

import "@ant-design/v5-patch-for-react-19";
import { Button, message, Modal } from "antd";

import styles from "@/styles/page.module.css";

const Overview: React.FC = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageAPI, contextHolder] = message.useMessage();
  const { value: id } = useSessionStorage<string>("id", "");

  //TODO: what is this? when where why is this info message set??
  useEffect(() => {
    const info = sessionStorage.getItem("infoMessage");
    if (info) {
      messageAPI.info(info, 5);
      sessionStorage.removeItem("infoMessage");
    }
  }, []);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={styles.page}>
      {contextHolder}
      <Header />
      <div className={styles.main}>
        <div className={styles.ctas}>
          <h2>Welcome to Hitster!</h2>
        </div>
        <div className={styles.ctas}>
          <>
            <Button
              type="primary"
              onClick={() => router.push(`/users/${id}/friends`)}
            >
              My Friend List
            </Button>
            <Button
              type="primary"
              onClick={() => router.push("/lobby/create")}
            >
              Create a new Lobby
            </Button>
            <Button
              type="primary"
              onClick={() =>
                router.push(
                  `/users/${id}/friends-lobby-requests`,
                )}
            >
              Friends & Lobby requests
            </Button>
            <Button type="default" onClick={showModal}>
              How the Game Works
            </Button>
          </>
        </div>
      </div>
      <Modal
        title="Rules of the game"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <h3>How it works:</h3>
        <ul>
          <li>Every player has his own timeline, initiated with one year.</li>
          <li>Play a snippet of a song for everyone to hear.</li>
          <li>
            Everyone can guess title and artist of the song to earn a coin.
          </li>
          <li>
            Place the song in the correct position in your timeline, based on
            its release year.
          </li>
          <li>
            Other players can challenge your placement if they think it is
            incorrect and place it at another position.
          </li>
          <li>
            The player that placed it at the correct position, wins the card and
            it is placed in his own timeline.
          </li>
          <li>
            For 3 coins, you can buy a card into your timeline. Therefore, it is
            advantageous to guess title and artist correctly.
          </li>
          <li>
            The game ends when the first player reaches 10 cards in his
            timeline.
          </li>
          <p>
            -------------------------------------------------------------------------------------------------------
          </p>
        </ul>
        <h3>YouTube video explaining the rules:</h3>
        <a
          href="https://www.youtube.com/watch?v=Y_NW6iZh1O0"
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch the Game Rules Video
        </a>
        <p>
          -------------------------------------------------------------------------------------------------------
        </p>
        <h3>Example Walkthrough:</h3>
        <p>
          When it is your turn, you press the play button to listen to a 30s
          snippet of a random song, which is played for all players. Your job is
          then to place the card (which represents the song) at the correct
          position in your timeline, based on when you think the song was
          released.
        </p>
        <p>
          For example, if your timeline consists of 3 cards with years 1975,
          1987, and 2012 respectively, and you think that the playing song was
          released in the 1990s, you place it between 1987 and 2012. The more
          cards you already have in your timeline, the more precise you must
          estimate the release year, the harder the game gets for you.
        </p>
        <p>
          After the snippet ends and you confirm your placement, your timeline
          with the new placement will be shown to the other players. If they
          don’t agree with the placement, they can challenge your placement. If
          they agree with your placement, they can deny the challenge.
        </p>
        <p>
          The first player to click the challenge button can then place the card
          at the position they think is correct. After the challenger has
          confirmed his placement, the correct placement is revealed, alongside
          with the title, artist and exact release year of the song. The player
          that placed it at the correct position, gets the card into his
          timeline and the next player’s turn starts.
        </p>
        <p>
          During the 30s when the song is playing, every player, regardless if
          it is their turn, can guess the title and artist of a song. If their
          guess is correct, they earn 1 coin, if it is incorrect, they neither
          gain nor lose anything, so it is always recommended to take a guess.
          Since the spelling is sensitive (i.e. &quot;Don&apos;t Fall&quot; is correct, &quot;Dont Fall&quot; is incorrect),
          players can guess as often as they want during the 30s snippet.
        </p>
        <p>
          Every player starts with 2 coins. For 3 coins, a player can buy a card
          into his timeline. This can be done at any point in the game.
        </p>
        <p>
          The game ends as soon as the first player reaches 10 cards in his own
          timeline.
        </p>
      </Modal>
    </div>
  );
};

export default withAuth(Overview);
