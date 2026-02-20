import { useEffect, useRef, useState, type FC } from "react";
import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  duration?: number;
  currentSong?: { duration: number };
  seek: (position: number) => void;
  getPosition: () => number;
}

export const ProgressBar: FC<ProgressBarProps> = ({
  duration,
  currentSong,
  seek,
  getPosition,
}) => {
  const [position, setPosition] = useState(0);
  const frameRef = useRef<number>(0);

  // Track drag state so the animation loop doesn't override the user's drag
  const isDraggingRef = useRef(false);

  const maxDuration = Math.max(duration ?? 0, currentSong?.duration ?? 0);

  // Only update the visual UI while moving the slider
  const handleDrag = (value: number): void => {
    isDraggingRef.current = true;
    setPosition(value);
  };

  // Commit the seek to the audio engine when the drag is released
  const handleDrop = (value: number): void => {
    seek(value);
    isDraggingRef.current = false;
  };

  useEffect(() => {
    if (!currentSong) return;

    const animate = () => {
      // Only pull the position from the audio engine if the user isn't holding the slider
      if (!isDraggingRef.current) {
        setPosition(getPosition());
      }
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [currentSong, getPosition]);

  return (
    <div className={styles.progressRow}>
      <span className={styles.time}>{formatTime(position)}</span>
      <input
        type="range"
        min={0}
        max={maxDuration || 0}
        value={Math.min(position, maxDuration || 0)}
        // Fire continuous UI updates
        onChange={(event) => handleDrag(Number(event.target.value))}
        // Fire the engine seek
        onMouseUp={(event) => handleDrop(Number(event.currentTarget.value))}
        onTouchEnd={(event) => handleDrop(Number(event.currentTarget.value))}
        className={styles.progressBar}
        disabled={!currentSong || maxDuration === 0}
      />
      <span className={styles.time}>{formatTime(maxDuration || 0)}</span>
    </div>
  );
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};
