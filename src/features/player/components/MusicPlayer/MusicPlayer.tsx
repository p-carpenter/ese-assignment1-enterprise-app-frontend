import { useEffect, type JSX } from "react";
import styles from "./MusicPlayer.module.css";
import { SongLibrary } from "@/features/songs";
import { type Song } from "@/features/songs/types";
import { ProgressBar } from "../ProgressBar/ProgressBar";
import { PlaybackControls } from "../PlaybackControls/PlaybackControls";
import { usePlayer } from "../../context/PlayerContext";

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
    if (songs.length === 0) {
      void refreshSongs();
    }
  }, [refreshSongs, songs.length]);

  const handleSongClick = (song: Song) => playSong(song, { onSongPlay });

  const handlePrev = (): void => {
    void playPrev();
  };

  const handleNext = (): void => {
    void playNext();
  };

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
            <p className={styles.artist}>{currentSong.artist}</p>

            <PlaybackControls
              isPlaying={isPlaying}
              isLoading={isLoading}
              onPlay={play}
              onPause={pause}
              onPrev={handlePrev}
              onNext={handleNext}
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

      <SongLibrary
        songs={songs}
        currentSongId={currentSong?.id}
        onSongClick={handleSongClick}
        onSongsChanged={refreshSongs}
      />
    </div>
  );
};
