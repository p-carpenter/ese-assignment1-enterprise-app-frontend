import { type FC } from "react";
import { Button } from "react-aria-components";
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
  isExpanded?: boolean;
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
  isExpanded = false,
}) => {
  // Scale icons up for mobile expanded view.
  const secondaryIconSize = isExpanded ? 32 : 16;
  const primaryIconSize = isExpanded ? 32 : 16;

  return (
    <div className={`${styles.buttons} ${isExpanded ? styles.expanded : ""}`}>
      <Button
        onPress={onPrev}
        className={styles.btn}
        isDisabled={disablePrev || isLoading}
        aria-label="Previous"
      >
        <IoPlaySkipBackSharp size={secondaryIconSize} />
      </Button>

      <Button
        onPress={() => (isPlaying ? onPause() : onPlay())}
        className={styles.btnPrimary}
        isDisabled={isLoading}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <IoPauseSharp size={primaryIconSize} />
        ) : (
          <IoPlaySharp size={primaryIconSize} />
        )}
      </Button>

      <Button
        onPress={onNext}
        className={styles.btn}
        isDisabled={disableNext || isLoading}
        aria-label="Next"
        
      >
        <IoPlaySkipForwardSharp size={secondaryIconSize} />
      </Button>
    </div>
  );
};
