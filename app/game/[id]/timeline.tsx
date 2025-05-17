import React, { useEffect, useState } from "react";
import { SongCard } from "@/types/songcard";

import "@ant-design/v5-patch-for-react-19";
import { Button, Typography } from "antd";

const { Title, Text } = Typography;

interface Props {
  title: string;
  timeline: SongCard[];
  isPlaying: boolean;
  isPlacementMode: boolean;
  confirmPlacement: (index: number) => void;
  activePlayerPlacement: number | null;
  challenge: boolean | null;
}

const Timeline: React.FC<Props> = (
  {
    title,
    timeline,
    isPlaying,
    isPlacementMode,
    confirmPlacement,
    activePlayerPlacement,
    challenge,
  },
) => {
  const [placement, setPlacement] = useState<number | null>(null); //position of placement of SongCard
  const [isFlipped, setIsFlipped] = useState<number | null>(null); //index of flipped SongCard
  const [challengeRunning, setChallengeRunning] = useState(false);

  useEffect(() => {
    if (challenge) setChallengeRunning(true);
  }, []);

  useEffect(() => {
    if (activePlayerPlacement != null) {
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

  const handleConfirmPlacement = () => {
    if (placement != null) {
      confirmPlacement(placement);
    }
  };

  return (
    <div>
      <div>
        {!challengeRunning && (
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
                      : (!(index == activePlayerPlacement &&
                        challengeRunning) && (
                        <div className="addButtonContainer">
                          <div
                            className="addButton"
                            onClick={() =>
                              addCard(index)}
                          >
                            <img
                              src="/img/plus.png"
                              alt="add"
                              className="plusIcon"
                            />
                          </div>
                        </div>
                      ))
                  )}
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
                    onClick={() => flipCard(index)}
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
                    : (!(challengeRunning &&
                      timeline.length === activePlayerPlacement) && (
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
                    ))
                )}
                {!isPlacementMode && (placement == timeline?.length
                  ? (
                    <div className="flipContainer">
                      <div className="songCard">
                        <Text strong style={{ fontSize: "30px" }}>
                          ?
                        </Text>
                      </div>
                    </div>
                  )
                  : <></>)}
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
