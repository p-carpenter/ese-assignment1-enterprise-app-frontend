import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlaybackControls,
  usePlayer,
  PlayHistory,
  WaveProgressBar,
} from "../..";
import { VolumeBar } from "../VolumeBar/VolumeBar";
import {
  IoTimeOutline,
  IoCloseOutline,
  IoRepeatOutline,
} from "react-icons/io5";
import styles from "./MiniPlayer.module.css";
import { SongMeta } from "./SongMeta";
import { PlaybackTimeDisplay } from "../PlaybackTimeDisplay/PlaybackTimeDisplay";
import { useIsOverflowing } from "../../hooks/useOverflow";

export const MiniPlayer = () => {
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

  const navigate = useNavigate();

  const titleRef = useRef<HTMLSpanElement>(null);
  const artistRef = useRef<HTMLSpanElement>(null);

  const isScrolling = useIsOverflowing(titleRef, [currentSong]);
  const isArtistScrolling = useIsOverflowing(artistRef, [currentSong]);

  const maxDuration = Math.max(duration ?? 0, currentSong?.duration ?? 0);
  const disableControls = 0 >= maxDuration || isLoading;

  return (
    <>
      <div className={styles.miniPlayer}>
        <button
          className={styles.metaButton}
          onClick={() => currentSong && navigate(`/songs/${currentSong.id}`)}
          aria-label="Go to song details"
          disabled={!currentSong}
        >
          <SongMeta
            titleRef={titleRef}
            artistRef={artistRef}
            isScrolling={isScrolling}
            isArtistScrolling={isArtistScrolling}
          />
        </button>

        <PlaybackControls
          isPlaying={isPlaying}
          isLoading={isLoading}
          onPlay={play}
          onPause={pause}
          onPrev={playPrev}
          onNext={playNext}
          disablePrev={disableControls}
          disableNext={disableControls}
        />

        <WaveProgressBar
          currentSong={currentSong ?? undefined}
          duration={duration}
          getPosition={getPosition}
          seek={seek}
        />

        <PlaybackTimeDisplay
          getPosition={getPosition}
          maxDuration={maxDuration}
          isPlaying={isPlaying}
        />

        <VolumeBar />

        <button
          className={`${styles.iconButton} ${isLooping ? styles.iconButtonActive : ""}`}
          onClick={toggleLoop}
          aria-label={isLooping ? "Disable loop" : "Enable loop"}
        >
          <IoRepeatOutline size={20} />
        </button>

        <div className={styles.historyAnchor}>
          <button
            popoverTarget="history-panel"
            className={styles.iconButton}
            aria-label="Toggle play history"
          >
            <IoTimeOutline size={20} />
          </button>

          <div
            id="history-panel"
            popover="auto"
            className={styles.historyPanel}
          >
            <div className={styles.historyPanelHeader}>
              <span className={styles.historyPanelTitle}>Recently Played</span>
              <button
                popoverTarget="history-panel"
                popoverTargetAction="hide"
                className={styles.historyPanelClose}
                aria-label="Close history"
              >
                <IoCloseOutline size={18} />
              </button>
            </div>
            <PlayHistory hideTitle />
          </div>
        </div>
      </div>
    </>
  );
};
