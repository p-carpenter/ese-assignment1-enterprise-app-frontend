import { useState, useRef } from "react";
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
  IoChevronDownOutline,
  IoChevronUpOutline,
} from "react-icons/io5";
import styles from "./MiniPlayer.module.css";
import { SongMeta } from "./SongMeta";
import { PlaybackTimeDisplay } from "../PlaybackTimeDisplay/PlaybackTimeDisplay";
import { useIsOverflowing } from "../../hooks/useOverflow";
import { LyricsSection } from "@/features/songs/pages/SongDetailsPage/components";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const titleRef = useRef<HTMLSpanElement>(null);
  const artistRef = useRef<HTMLSpanElement>(null);

  const isScrolling = useIsOverflowing(titleRef, [currentSong]);
  const isArtistScrolling = useIsOverflowing(artistRef, [currentSong]);

  const maxDuration = Math.max(duration ?? 0, currentSong?.duration ?? 0);
  const disableControls = 0 >= maxDuration || isLoading;

  const handleMetaClick = () => {
    if (!currentSong) return;
    if (window.innerWidth <= 920) {
      setIsExpanded(true);
    } else {
      navigate(`/songs/${currentSong.id}`);
    }
  };

  return (
    <div
      className={`${styles.miniPlayer} ${isExpanded ? styles.expanded : ""}`}
    >
      {isExpanded ? (
        <div className={styles.expandedLayout}>
          <div className={styles.expandedHeader}>
            <button
              className={styles.collapseButton}
              onClick={() => setIsExpanded(false)}
              aria-label="Collapse player"
            >
              <IoChevronDownOutline size={28} />
            </button>
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
            <button
              className={`${styles.iconButton} ${isLooping ? styles.iconButtonActive : ""}`}
              onClick={toggleLoop}
              aria-label={isLooping ? "Disable loop" : "Enable loop"}
            >
              <IoRepeatOutline size={24} />
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
              isExpanded={true}
            />

            <div className={styles.historyAnchor}>
              <button
                popoverTarget="history-panel"
                className={styles.iconButton}
                aria-label="Toggle play history"
              >
                <IoTimeOutline size={24} />
              </button>

              <div
                id="history-panel"
                popover="auto"
                className={styles.historyPanel}
              >
                <div className={styles.historyPanelHeader}>
                  <span className={styles.historyPanelTitle}>
                    Recently Played
                  </span>
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
          <div className={styles.expandedBottomAction}>
            <button
              className={styles.lyricsToggleBtn}
              onClick={() => setShowLyrics(true)}
            >
              Lyrics <IoChevronUpOutline size={18} />
            </button>
          </div>
          <div
            className={`${styles.lyricsOverlay} ${showLyrics ? styles.lyricsVisible : ""}`}
          >
            <div className={styles.lyricsHeader}>
              <span className={styles.lyricsTitle}>Lyrics</span>
              <button
                className={styles.collapseButton}
                onClick={() => setShowLyrics(false)}
              >
                <IoChevronDownOutline size={28} />
              </button>
            </div>
            <div className={styles.lyricsContent}>
              {currentSong && showLyrics && (
                <LyricsSection song={currentSong} />
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            className={styles.metaWrapper}
            onClick={handleMetaClick}
            role={currentSong ? "button" : undefined}
            tabIndex={currentSong ? 0 : undefined}
            aria-label="View song details"
          >
            <SongMeta
              titleRef={titleRef}
              artistRef={artistRef}
              isScrolling={isScrolling}
              isArtistScrolling={isArtistScrolling}
              isExpanded={false}
            />
          </div>

          <div className={styles.mainControls}>
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
          </div>

          <div className={styles.progressWrapper}>
            <WaveProgressBar
              currentSong={currentSong ?? undefined}
              duration={duration}
              getPosition={getPosition}
              seek={seek}
              isExpanded={false}
            />
          </div>

          <div className={styles.desktopControls}>
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
                  <span className={styles.historyPanelTitle}>
                    Recently Played
                  </span>
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
      )}
    </div>
  );
};
