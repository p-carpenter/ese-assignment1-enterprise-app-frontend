import { useRef, useState, useEffect } from "react";
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
  const [position, setPosition] = useState(0);
  const frameRef = useRef<number>(0);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const historyPanelRef = useRef<HTMLDivElement>(null);
  const historyBtnRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const artistRef = useRef<HTMLSpanElement>(null);
  const [isArtistScrolling, setIsArtistScrolling] = useState(false);

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

  // Observe the *parent* container, not the span itself.
  // Watching the span causes a feedback loop: applying .scrolling sets
  // width:max-content which changes the span's clientWidth, triggering the
  // observer again and toggling the class on/off (flicker).
  // The parent is capped at 150px and is stable, so the observer only fires
  // on genuine container resizes, not because of the animation class.
  useEffect(() => {
    const el = titleRef.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const check = () => setIsScrolling(el.scrollWidth > parent.clientWidth);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [currentSong]);

  useEffect(() => {
    const el = artistRef.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const check = () =>
      setIsArtistScrolling(el.scrollWidth > parent.clientWidth);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [currentSong]);

  useEffect(() => {
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
  const displayPosition = currentSong ? position : 0;

  return (
    <>
      {/* Mini Player bar */}
      <div className={styles.miniPlayer}>
        {/* Clickable album art & meta opens Now Playing */}
        <button
          className={styles.metaButton}
          onClick={() => currentSong && navigate(`/songs/${currentSong.id}`)}
          aria-label="Go to song details"
          disabled={!currentSong}
        >
          <img
            src={currentSong?.cover_art_url || "https://placehold.co/48"}
            alt={currentSong?.title || "No track"}
            className={styles.albumArt}
          />
          <div className={styles.trackMeta}>
            <span
              ref={titleRef}
              className={`${styles.trackTitle} ${isScrolling ? styles.scrolling : ""}`}
            >
              {currentSong?.title || "No track selected"}
            </span>
            <span
              ref={artistRef}
              className={`${styles.trackArtist} ${isArtistScrolling ? styles.scrolling : ""}`}
            >
              {currentSong?.artist || "—"}
            </span>
          </div>
        </button>

        <PlaybackControls
          compact
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
        <WaveProgressBar
          currentSong={currentSong ?? undefined}
          duration={duration}
          getPosition={getPosition}
          seek={seek}
        />

        {/* Time elapsed / duration */}
        <span className={styles.timeDisplay}>
          {formatTime(displayPosition)}&nbsp;/&nbsp;{formatTime(maxDuration)}
        </span>

        {/* Volume */}
        <VolumeBar />

        {/* Loop toggle */}
        <button
          className={`${styles.iconButton} ${isLooping ? styles.iconButtonActive : ""}`}
          onClick={toggleLoop}
          aria-label={isLooping ? "Disable loop" : "Enable loop"}
        >
          <IoRepeatOutline size={20} />
        </button>

        {/* History toggle - panel is anchored above this button */}
        <div className={styles.historyAnchor}>
          {isHistoryOpen && (
            <div className={styles.historyPanel} ref={historyPanelRef}>
              <div className={styles.historyPanelHeader}>
                <span className={styles.historyPanelTitle}>
                  Recently Played
                </span>
                <button
                  className={styles.historyPanelClose}
                  onClick={() => setIsHistoryOpen(false)}
                  aria-label="Close history"
                >
                  <IoCloseOutline size={18} />
                </button>
              </div>
              <PlayHistory hideTitle />
            </div>
          )}
          <button
            ref={historyBtnRef}
            className={`${styles.iconButton} ${isHistoryOpen ? styles.iconButtonActive : ""}`}
            onClick={() => setIsHistoryOpen((v) => !v)}
            aria-label="Toggle play history"
          >
            <IoTimeOutline size={20} />
          </button>
        </div>
      </div>
    </>
  );
};
