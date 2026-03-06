import { useEffect, useRef, useState } from "react";
import { PlaybackControls, usePlayer, MusicPlayer, PlayHistory } from "../..";
import { WaveProgressBar } from "../WaveProgressBar/WaveProgressBar";
import { VolumeBar } from "../VolumeBar/VolumeBar";
import {
  IoTimeOutline,
  IoChevronDownOutline,
  IoCloseOutline,
} from "react-icons/io5";
import styles from "./MiniPlayer.module.css";

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

export const MiniPlayer = () => {
  const {
    currentSong,
    isPlaying,
    isLoading,
    duration,
    play,
    pause,
    playPrev,
    playNext,
    seek,
    getPosition,
    historyTick,
  } = usePlayer();

  const [position, setPosition] = useState(0);
  const frameRef = useRef<number>(0);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const historyPanelRef = useRef<HTMLDivElement>(null);
  const historyBtnRef = useRef<HTMLButtonElement>(null);

  // Close history on click-outside
  useEffect(() => {
    if (!isHistoryOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        historyPanelRef.current?.contains(target) ||
        historyBtnRef.current?.contains(target)
      )
        return;
      setIsHistoryOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isHistoryOpen]);

  // Close history on Escape
  useEffect(() => {
    if (!isHistoryOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsHistoryOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isHistoryOpen]);

  useEffect(() => {
    if (!currentSong) {
      setPosition(0);
      return;
    }
    const tick = () => {
      setPosition(getPosition());
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [currentSong, getPosition]);

  const maxDuration = Math.max(duration ?? 0, currentSong?.duration ?? 0);
  const disableControls = 0 >= maxDuration || isLoading;

  return (
    <>
      {/* Now Playing full-screen overlay */}
      {isNowPlayingOpen && (
        <div className={styles.nowPlayingOverlay}>
          <button
            className={styles.nowPlayingClose}
            onClick={() => setIsNowPlayingOpen(false)}
            aria-label="Close now playing"
          >
            <IoChevronDownOutline size={28} />
          </button>
          <div className={styles.nowPlayingContent}>
            <MusicPlayer />
          </div>
        </div>
      )}

      {/* History panel */}
      {isHistoryOpen && (
        <div className={styles.historyPanel} ref={historyPanelRef}>
          <div className={styles.historyPanelHeader}>
            <span className={styles.historyPanelTitle}>Recently Played</span>
            <button
              className={styles.historyPanelClose}
              onClick={() => setIsHistoryOpen(false)}
              aria-label="Close history"
            >
              <IoCloseOutline size={18} />
            </button>
          </div>
          <PlayHistory key={historyTick} hideTitle />
        </div>
      )}

      {/* Mini Player bar */}
      <div className={styles.miniPlayer}>
        {/* Clickable album art & meta opens Now Playing */}
        <button
          className={styles.metaButton}
          onClick={() => currentSong && setIsNowPlayingOpen(true)}
          aria-label="Open now playing"
          disabled={!currentSong}
        >
          <img
            src={currentSong?.cover_art_url || "https://placehold.co/48"}
            alt={currentSong?.title || "No track"}
            className={styles.albumArt}
          />
          <div className={styles.trackMeta}>
            <span className={styles.trackTitle}>
              {currentSong?.title || "No track selected"}
            </span>
            <span className={styles.trackArtist}>
              {currentSong?.artist || "—"}
            </span>
          </div>
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

        {/* Waveform progress bar */}
        <WaveProgressBar currentSong={currentSong ?? undefined} seek={seek} />

        {/* Time elapsed / duration */}
        <span className={styles.timeDisplay}>
          {formatTime(position)}&nbsp;/&nbsp;{formatTime(maxDuration)}
        </span>

        {/* Volume */}
        <VolumeBar />

        {/* History toggle */}
        <button
          ref={historyBtnRef}
          className={`${styles.iconButton} ${isHistoryOpen ? styles.iconButtonActive : ""}`}
          onClick={() => setIsHistoryOpen((v) => !v)}
          aria-label="Toggle play history"
        >
          <IoTimeOutline size={20} />
        </button>
      </div>
    </>
  );
};
