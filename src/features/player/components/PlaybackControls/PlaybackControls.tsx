import { type FC } from "react";
import styles from "./PlaybackControls.module.css";
import {
  IoPlaySkipBackSharp,
  IoPlaySkipForwardSharp,
  IoPlaySharp,
  IoPauseSharp,
} from "react-icons/io5";

interface PlaybackControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: () => void;
  onPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  disablePrev: boolean;
  disableNext: boolean;
}

export const PlaybackControls: FC<PlaybackControlsProps> = ({
  isPlaying,
  isLoading,
  onPlay,
  onPause,
  onPrev,
  onNext,
  disablePrev,
  disableNext,
}) => {
  return (
    <div className={styles.buttons}>
      <button
        onClick={onPrev}
        className={styles.btn}
        disabled={disablePrev || isLoading}
        aria-label="Previous"
      >
        <IoPlaySkipBackSharp size={16} />
      </button>

      <button
        onClick={() => (isPlaying ? onPause() : onPlay())}
        className={styles.btnPrimary}
        disabled={isLoading}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <IoPauseSharp size={16} /> : <IoPlaySharp size={16} />}
      </button>

      <button
        onClick={onNext}
        className={styles.btn}
        disabled={disableNext || isLoading}
        aria-label="Next"
      >
        <IoPlaySkipForwardSharp size={16} />
      </button>
    </div>
  );
};
