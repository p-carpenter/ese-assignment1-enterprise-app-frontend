import { type FC } from "react";
import styles from "../MusicPlayer/MusicPlayer.module.css";
import { ButtonPause2Solid, ButtonPlaySolid, ButtonPreviousSolid, ButtonNextSolid } from "@/shared/icons";

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
        className={styles.secondaryButton}
        disabled={disablePrev || isLoading}
        aria-label="Previous"
      >
        <ButtonPreviousSolid />
      </button>

      <button
        onClick={() => (isPlaying ? onPause() : onPlay())}
        className={styles.primaryButton}
        // Prevent users from spamming play/pause while the engine is seeking
        disabled={isLoading}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isLoading ? (
          <ButtonPause2Solid />
        ) : isPlaying ? (
          <ButtonPause2Solid />
        ) : (
          <ButtonPlaySolid />
        )}
      </button>

      <button
        onClick={onNext}
        className={styles.secondaryButton}
        disabled={disableNext || isLoading}
        aria-label="Next"
      >
        <ButtonNextSolid />
      </button>
    </div>
  );
};
