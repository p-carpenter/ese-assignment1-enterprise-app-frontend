import { useEffect, useCallback, type JSX } from "react";
import styles from "./MusicPlayer.module.css";
import { type Song } from "@/features/songs/types";
import { ProgressBar } from "../ProgressBar/ProgressBar";
import { PlaybackControls } from "../PlaybackControls/PlaybackControls";
import { usePlayer } from "../../../../shared/context/PlayerContext";

interface MusicPlayerProps {
  onSongPlay?: () => void;
}

export const MusicPlayer = ({ onSongPlay }: MusicPlayerProps): JSX.Element => {
  const {
    songs,
    currentSong,
    isPlaying,
    isLoading,
    duration,
    play,
    pause,
    seek,
    getPosition,
    refreshSongs,
    playSong,
    playPrev,
    playNext,
  } = usePlayer();

  useEffect(() => {
    void refreshSongs();
  }, [refreshSongs]);

  useCallback(
    (song: Song) => {
      void playSong(song, { onSongPlay });
    },
    [playSong, onSongPlay],
  );

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
              disablePrev={songs.length === 0}
              disableNext={songs.length === 0}
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
