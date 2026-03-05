import { type JSX } from "react";
import styles from "./MusicPlayer.module.css";
import { ProgressBar } from "../ProgressBar/ProgressBar";
import { PlaybackControls } from "../PlaybackControls/PlaybackControls";
import { usePlayer } from "../../../../shared/context/PlayerContext";

export const MusicPlayer = (): JSX.Element => {
  const {
    playlist,
    currentSong,
    isPlaying,
    isLoading,
    duration,
    play,
    pause,
    seek,
    getPosition,
    playPrev,
    playNext,
  } = usePlayer();

  const disableControls = playlist.length === 0;

  return (
    <div className={styles.container}>
      <div className={styles.playerControls}>
        {currentSong ? (
          <>
            <img
              src={currentSong.cover_art_url || "https://placehold.co/100"}
              alt="Album Art"
              className={styles.albumArt}
            />

            <h3 className={styles.title}>{currentSong.title}</h3>

            <h3 className={styles.artist}>
              {currentSong.album} • {currentSong.release_year}
            </h3>

            <p className={styles.artist}>{currentSong.artist}</p>

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

            <ProgressBar
              currentSong={currentSong}
              getPosition={getPosition}
              seek={seek}
              duration={duration}
            />
          </>
        ) : (
          <p className={styles.emptyState}>
            Select a track from the library below
          </p>
        )}
      </div>
    </div>
  );
};
