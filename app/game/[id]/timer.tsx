import React from "react";

interface TimerProps {
  timeLeft: number;
}


const Timer: React.FC<TimerProps> = ({timeLeft}) => {
  const formatTimeLeft = (time:number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds;
    return `${minutes}:${paddedSeconds}`;
  };

  return (
    <div className="timer">
      <svg className="timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g className="timer__circle">
          <circle className="timer__path-elapsed" cx="50" cy="50" r="45"/>
          <path
            className="timer__path-remaining green"
            d="
                M 50, 50
                m -45, 0
                a 45,45 0 1,0 90,0
                a 45,45 0 1,0 -90,0
              "
          ></path>
        </g>
      </svg>
      <span id="timer-label" className="timer__label">{formatTimeLeft(timeLeft)}</span>
    </div>


  );

};

export default Timer;