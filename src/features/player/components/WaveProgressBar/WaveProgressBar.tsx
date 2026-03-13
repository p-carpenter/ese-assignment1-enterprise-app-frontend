import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FC,
  type PointerEvent,
} from "react";
import styles from "./WaveProgressBar.module.css";

const BAR_COUNT = 280;

/** Static placeholder waveform used for all songs. */
const PLACEHOLDER_BARS: number[] = Array.from({ length: BAR_COUNT }, (_, i) =>
  Math.round(12 + Math.abs(Math.sin(i * 0.71) * 55 + Math.sin(i * 0.29) * 25)),
);

interface WaveProgressBarProps {
  currentSong?: { duration: number; id: number };
  duration?: number;
  seek: (position: number) => void;
  getPosition: () => number;
}

export const WaveProgressBar: FC<WaveProgressBarProps> = ({
  currentSong,
  duration: audioDuration,
  seek,
  getPosition,
}) => {
  const frameRef = useRef<number>(0);
  const isDraggingRef = useRef(false);
  const [position, setPosition] = useState(0);

  const duration = Math.max(audioDuration ?? 0, currentSong?.duration ?? 0);
  const displayPosition = currentSong ? position : 0;
  // Sync progress from the audio engine on every frame
  useEffect(() => {
    const animate = () => {
      if (!isDraggingRef.current) {
        setPosition(getPosition());
      }
      frameRef.current = requestAnimationFrame(animate);
    };
    if (currentSong) {
      frameRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [currentSong, getPosition]);

  const getRelX = useCallback((e: PointerEvent<HTMLDivElement>): number => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return 0;
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }, []);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!currentSong || duration === 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setPosition(getRelX(e) * duration);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    setPosition(getRelX(e) * duration);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const newPosition = getRelX(e) * duration;
    setPosition(newPosition);
    seek(newPosition);
    isDraggingRef.current = false;
  };

  const displayProgress = duration > 0 ? displayPosition / duration : 0;

  return (
    <div className={styles.container}>
      <div
        className={styles.wrapper}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="slider"
        aria-label="Seek"
        aria-valuenow={Math.round(displayPosition)}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        tabIndex={currentSong ? 0 : -1}
      >
        {PLACEHOLDER_BARS.map((h, i) => (
          <div
            key={i}
            className={`${styles.bar} ${
              i / BAR_COUNT < displayProgress
                ? styles.barPlayed
                : styles.barUnplayed
            }`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
};
