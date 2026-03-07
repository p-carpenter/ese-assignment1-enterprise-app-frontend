import { type FC } from "react";
import musicStyles from "../MusicPlayer/MusicPlayer.module.css";
import compactStyles from "./PlaybackControls.module.css";
import {
  ButtonPause2Solid,
  ButtonPlaySolid,
  ButtonPreviousSolid,
  ButtonNextSolid,
} from "@/shared/icons";
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
  compact?: boolean;
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
  compact = false,
}) => {
  if (compact) {
    return (
      <div className={compactStyles.buttons}>
        <button
          onClick={onPrev}
          className={compactStyles.btn}
          disabled={disablePrev || isLoading}
          aria-label="Previous"
        >
          <IoPlaySkipBackSharp size={16} />
        </button>

        <button
          onClick={() => (isPlaying ? onPause() : onPlay())}
          className={compactStyles.btnPrimary}
          disabled={isLoading}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <IoPauseSharp size={16} /> : <IoPlaySharp size={16} />}
        </button>

        <button
          onClick={onNext}
          className={compactStyles.btn}
          disabled={disableNext || isLoading}
          aria-label="Next"
        >
          <IoPlaySkipForwardSharp size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className={musicStyles.buttons}>
      <button
        onClick={onPrev}
        className={musicStyles.secondaryButton}
        disabled={disablePrev || isLoading}
        aria-label="Previous"
      >
        <ButtonPreviousSolid />
      </button>

      <button
        onClick={() => (isPlaying ? onPause() : onPlay())}
        className={musicStyles.primaryButton}
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
        className={musicStyles.secondaryButton}
        disabled={disableNext || isLoading}
        aria-label="Next"
      >
        <ButtonNextSolid />
      </button>
    </div>
  );
};
