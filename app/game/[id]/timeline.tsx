import React, { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { SongCard } from "@/types/songcard";

import "@ant-design/v5-patch-for-react-19";
import { Button, message, Typography } from "antd";

const { Title, Text } = Typography;

interface Props {
  title: string;
  timeline: SongCard[];
  songCard: SongCard | null;
  gameId: string;
  isPlaying: boolean;
  isPlacementMode: boolean;
  confirmPlacement: (index: number) => void;
  activePlayerPlacement: number | null;
  challenge: boolean | null;
}

//TODO: delete Props I do not need
const Timeline: React.FC<Props> = (
  {
    title,
    timeline,
    songCard,
    gameId,
    isPlaying,
    isPlacementMode,
    confirmPlacement,
    activePlayerPlacement,
    challenge,
  },
) => {
  const [placement, setPlacement] = useState<number | null>(null); //position of placement of SongCard
  const [isFlipped, setIsFlipped] = useState<number | null>(null); //index of flipped SongCard
  const [messageAPI, contextHolder] = message.useMessage();
  const apiService = useApi();
  const [challengeRunning, setChallengeRunning] = useState(false);

  useEffect(() => {
    if (challenge){setChallengeRunning(true);}
  }, []);

  useEffect(() => {
    if (activePlayerPlacement != null) {
      console.log(
        "in use Effect with active PlayerPlacement " + activePlayerPlacement,
      );
      setPlacement(activePlayerPlacement);
    }
  }, [activePlayerPlacement]);

  const addCard = function (index: number) {
    setPlacement(index);
  };

  const flipCard = function (index: number) {
    if (isFlipped === index) { // if card already flipped
      setIsFlipped(null);
      return;
    }
    setIsFlipped(index);
  };

  const handleConfirmPlacement = async (): Promise<void> => {
    //TODO: this does not need to check if placement is correct,
    //that will happen only AFTER Challenge phase
    //but code left here (commented out) to be copied to correct place

    if (placement != null) {
      confirmPlacement(placement);
    }

    /*     const year = songCard?.year;
    let yearBefore = -1;
    let yearAfter = 3000;
    if (
      placement != null &&
      year != null
    ) {
      if (placement > 0) yearBefore = timeline[placement - 1].year;
      if (placement < timeline.length) {
        yearAfter = timeline[placement].year;
      }
      if (yearBefore <= year && yearAfter >= year) {
        messageAPI.success("Congratulations, your placement is correct!");

        //actually place the songCard into the timeline
        const userId = sessionStorage.getItem("id");
        const body = {
          "songCard": songCard,
          "position": placement,
        };
        try {
          await apiService.put(`/games/${gameId}/${userId}`, body);
        } catch (error) {
          if (error instanceof Error) {
            alert(`Something went wrong during the guess:\n${error.message}`);
            console.error(error);
          } else {
            console.error("An unknown error occurred during guess.");
          }
        }
      } else {
        messageAPI.warning("Wrong placement.");
      }
    }
    placementConfirmed();
    */
  };

  //TODO: look that challenger cannot place at same position as activePlayer

  return (
    <div>
      {contextHolder}
      <div>
        { !challengeRunning && (
          <div className="songCardContainer">
            {placement == null &&
              isPlacementMode && (
                <div className="songCard">
                  <Text strong style={{fontSize: "30px"}}>?</Text>
                </div>
              )}
          </div>
        )}
        <Title level={4} style={{ textAlign: "center" }}>
          {title}
        </Title>
        {timeline && timeline.length > 0
          ? (
            <div className="timeline">
              {timeline.map((card: SongCard, index: number) => (
                <React.Fragment key={index}>
                  {isPlacementMode && (
                    placement == index
                      ? (
                        <div className="flipContainer">
                          <div className="songCard">
                            <Text strong style={{ fontSize: "30px" }}>
                              ?
                            </Text>
                          </div>
                        </div>
                      )
                      : (
                        <div className="addButtonContainer">
                          <div
                            className="addButton"
                            onClick={() => addCard(index)}
                          >
                            <img
                              src="/img/plus.png"
                              alt="add"
                              className="plusIcon"
                            />
                          </div>
                        </div>
                      )
                  )}
                  {/* TODO: this does not yet work if the placement is behind the last card */}
                  {!isPlacementMode && (
                    placement == index
                      ? (
                        <div className="flipContainer">
                          <div className="songCard">
                            <Text strong style={{ fontSize: "30px" }}>
                              ?
                            </Text>
                          </div>
                        </div>
                      )
                      : <></>
                  )}

                  <div
                    key={index}
                    onClick={() =>
                      flipCard(index)}
                    className="flipContainer"
                  >
                    <div
                      className={`songCard ${
                        isFlipped === index ? "flipped" : ""
                      }`}
                    >
                      <div className="front">
                        <Text strong>{card.year}</Text>
                      </div>
                      <div className="back">
                        <Text
                          strong
                          style={{ fontSize: "14px", color: "#fefae0" }}
                        >
                          {card.title}
                        </Text>
                        <Text type="secondary" style={{ fontSize: "14px" }}>
                          {card.artist}
                        </Text>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
              <div>
                {isPlacementMode && (
                  placement == timeline?.length
                    ? (
                      <div className="flipContainer">
                        <div className="songCard">
                          <Text strong style={{ fontSize: "30px" }}>?</Text>
                        </div>
                      </div>
                    )
                    : (
                      <div className="addButtonContainer">
                        <div
                          className="addButton"
                          onClick={() => addCard(timeline.length)}
                        >
                          <img
                            src="/img/plus.png"
                            alt="add"
                            className="plusIcon"
                          />
                        </div>
                      </div>
                    )
                )}
              </div>
            </div>
          )
          : <Text type="secondary">No songcards in timeline.</Text>}
      </div>
      {(placement != null) && (!isPlaying) && isPlacementMode && (
        <Button onClick={handleConfirmPlacement}>Confirm</Button>
      )}
    </div>
  );
};

export default Timeline;
