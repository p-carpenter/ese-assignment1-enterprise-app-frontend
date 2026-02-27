/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAudioPlayer } from "react-use-audio-player";
import { listSongs, logPlay } from "@/features/songs/api";
import { type Song } from "@/features/songs/types";

interface PlaySongOptions {
  onSongPlay?: () => void;
}

interface PlayerContextType {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  isLoading: boolean;
  duration: number;
  play: () => void;
  pause: () => void;
  seek: (position: number) => void;
  getPosition: () => number;
  refreshSongs: () => Promise<void>;
  playSong: (song: Song, options?: PlaySongOptions) => Promise<void>;
  playPrev: () => Promise<void>;
  playNext: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
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

  const currentIndex = useMemo((): number => {
    if (!currentSong) return -1;
    return songs.findIndex((song) => song.id === currentSong.id);
  }, [currentSong, songs]);

  const playNextRef = useRef<(() => Promise<void>) | undefined>(undefined);

  const refreshSongs = useCallback(async () => {
    try {
      const data = await listSongs();
      setSongs(data);

      setCurrentSong((previousSong) => {
        if (!previousSong) return null;
        const updatedSong = data.find((song) => song.id === previousSong.id);
        return updatedSong ?? null;
      });
    } catch (err) {
      console.error("Failed to load songs:", err);
    }
  }, []);

  const playSong = useCallback(
    async (song: Song, options?: PlaySongOptions): Promise<void> => {
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
        onend: () => {
          void playNextRef.current?.();
        },
      });

      try {
        await logPlay(song.id);
        options?.onSongPlay?.();
      } catch (err) {
        console.error("Failed to log play:", err);
      }
    },
    [currentSong?.id, isPlaying, load, pause, play, stop],
  );

  const playPrev = useCallback(async (): Promise<void> => {
    if (songs.length === 0) return;
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : songs.length - 1;
    await playSong(songs[prevIndex]);
  }, [currentIndex, playSong, songs]);

  const playNext = useCallback(async (): Promise<void> => {
    if (songs.length === 0) return;
    const nextIndex =
      currentIndex >= 0 && currentIndex < songs.length - 1
        ? currentIndex + 1
        : 0;
    await playSong(songs[nextIndex]);
  }, [currentIndex, playSong, songs]);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  return (
    <PlayerContext.Provider
      value={{
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
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return context;
};