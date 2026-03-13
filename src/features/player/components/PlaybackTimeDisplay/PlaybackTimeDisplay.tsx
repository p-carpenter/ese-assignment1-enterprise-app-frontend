import { useEffect, useRef, useMemo } from "react";
import styles from "./PlaybackTimeDisplay.module.css";

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds <= 0) return "0:00";

  const totalSeconds = Math.round(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

interface PlaybackTimeDisplayProps {
  getPosition: () => number;
  maxDuration: number;
  isPlaying: boolean;
}

export const PlaybackTimeDisplay = ({
  getPosition,
  maxDuration,
  isPlaying,
}: PlaybackTimeDisplayProps) => {
  const timeDisplayRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<number>(0);

  const formattedMax = useMemo(() => formatTime(maxDuration), [maxDuration]);

  useEffect(() => {
    if (!isPlaying) return;

    const tick = () => {
      if (timeDisplayRef.current) {
        timeDisplayRef.current.textContent = `${formatTime(getPosition())} / ${formattedMax}`;
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [getPosition, isPlaying, formattedMax]);

  return (
    <span
      aria-label="Playback time"
      className={styles.timeDisplay}
      ref={timeDisplayRef}
    >
      {formatTime(getPosition())} / {formattedMax}
    </span>
  );
};
