import { useEffect, useMemo, useState, type JSX } from "react";
import { useAudioPlayer } from "react-use-audio-player";
import { api } from "../../../services/api";
import { type Song } from "../../../types";
import styles from "./MusicPlayer.module.css";
import SongLibrary from "../songs/SongLibrary";
import ProgressBar from "./ProgressBar";
import PlaybackControls from "./PlaybackControls";

interface MusicPlayerProps {
  onSongPlay?: () => void;
}

const MusicPlayer = ({ onSongPlay }: MusicPlayerProps): JSX.Element => {
  // Extract isLoading here
  const {
    play,
    pause,
    stop,
    isPlaying,
    isLoading,
    load,
    getPosition,
    seek,
    duration,
  } = useAudioPlayer();
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  const refreshSongs = () => {
    api.songs
      .list()
      .then((data) => setSongs(data))
      .catch((err) => console.error("Failed to load library", err));
  };

  useEffect(() => {
    refreshSongs();
  }, []);

  const playSong = async (song: Song): Promise<void> => {
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
      return;
    }

    stop();
    setCurrentSong(song);

    load(song.file_url, {
      autoplay: true,
      format: "mp3",
      html5: true,
      onend: () => console.log("Song finished!"),
    });

    try {
      await api.songs.logPlay(song.id);

      if (onSongPlay) {
        onSongPlay();
      }
    } catch (err) {
      console.error("Failed to log play:", err);
    }
  };

  const currentIndex = useMemo((): number => {
    if (!currentSong) return -1;
    return songs.findIndex((song) => song.id === currentSong.id);
  }, [songs, currentSong]);

  const handlePrev = (): void => {
    if (songs.length === 0) return;
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : songs.length - 1;
    void playSong(songs[prevIndex]);
  };

  const handleNext = (): void => {
    if (songs.length === 0) return;
    const nextIndex =
      currentIndex >= 0 && currentIndex < songs.length - 1
        ? currentIndex + 1
        : 0;
    void playSong(songs[nextIndex]);
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
        onSongClick={playSong}
        onSongsChanged={refreshSongs}
      />
    </div>
  );
};

export default MusicPlayer;
