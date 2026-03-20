import { useRef } from "react";
import { Button, ToggleButton } from "react-aria-components";
import {
  PlaybackControls,
  usePlayer,
  WaveProgressBar,
  PlaybackTimeDisplay,
  SongMeta,
} from "..";
import { IoRepeatOutline, IoChevronDownOutline } from "react-icons/io5";
import { useIsOverflowing } from "@/features/player/hooks";
import { HistoryPopover } from "./HistoryPopover/HistoryPopover";
import { LyricsModal } from "./LyricsModal/LyricsModal";
import styles from "./ExpandedPlayer.module.css";

interface Props {
  onCollapse: () => void;
}

export const ExpandedPlayer = ({ onCollapse }: Props) => {
  const {
    currentSong,
    isPlaying,
    isLoading,
    isLooping,
    duration,
    play,
    pause,
    playPrev,
    playNext,
    seek,
    getPosition,
    toggleLoop,
  } = usePlayer();

  const titleRef = useRef<HTMLSpanElement>(null);
  const artistRef = useRef<HTMLSpanElement>(null);

  const isScrolling = useIsOverflowing(titleRef, [currentSong]);
  const isArtistScrolling = useIsOverflowing(artistRef, [currentSong]);

  const maxDuration = Math.max(duration ?? 0, currentSong?.duration ?? 0);
  const disableControls = maxDuration <= 0 || isLoading;

  return (
    <div className={styles.expandedPlayer}>
      <div className={styles.expandedHeader}>
        <Button
          className={styles.collapseButton}
          onPress={onCollapse}
          aria-label="Collapse player"
        >
          <IoChevronDownOutline size={28} />
        </Button>
        <span className={styles.headerTitle}>Now Playing</span>
        <div className={styles.headerSpacer} />
      </div>

      <div className={styles.expandedMetaWrapper}>
        <SongMeta
          titleRef={titleRef}
          artistRef={artistRef}
          isScrolling={isScrolling}
          isArtistScrolling={isArtistScrolling}
          isExpanded={true}
        />
      </div>

      <div className={styles.expandedProgress}>
        <WaveProgressBar
          currentSong={currentSong ?? undefined}
          duration={duration}
          getPosition={getPosition}
          seek={seek}
          isExpanded={true}
        />
        <div className={styles.expandedTimeInfo}>
          <PlaybackTimeDisplay
            getPosition={getPosition}
            maxDuration={maxDuration}
            isPlaying={isPlaying}
          />
        </div>
      </div>

      <div className={styles.expandedPlaybackRow}>
        <ToggleButton
          className={styles.iconButton}
          isSelected={isLooping}
          onChange={toggleLoop}
          aria-label="Loop playback"
        >
          <IoRepeatOutline size={24} />
        </ToggleButton>

        <PlaybackControls
          isPlaying={isPlaying}
          isLoading={isLoading}
          onPlay={play}
          onPause={pause}
          onPrev={playPrev}
          onNext={playNext}
          disablePrev={disableControls}
          disableNext={disableControls}
          isExpanded={true}
        />

        <HistoryPopover />
      </div>

      <div className={styles.expandedBottomAction}>
        <LyricsModal currentSong={currentSong} />
      </div>
    </div>
  );
};
