import { useState, useEffect, useRef } from "react";
import styles from "./PlaybackTimeDisplay.module.css";

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

interface PlaybackTimeDisplayProps {
  getPosition: () => number;
  maxDuration: number;
}

export const PlaybackTimeDisplay = ({
  getPosition,
  maxDuration,
}: PlaybackTimeDisplayProps) => {
  const [position, setPosition] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const tick = () => {
      setPosition(getPosition());
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [getPosition]);

  return (
    <span className={styles.timeDisplay}>
      {formatTime(position)}&nbsp;/&nbsp;{formatTime(maxDuration)}
    </span>
  );
};
