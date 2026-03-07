/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { useAudioPlayer } from "react-use-audio-player";
import { useQueryClient } from "@tanstack/react-query";
import { logPlay } from "@/features/songs/api";
import { type Song } from "@/features/songs/types";

export interface PlayerContextType {
  currentSong: Song | null;
  playlist: Song[];
  isPlaying: boolean;
  isLoading: boolean;
  isLooping: boolean;
  duration: number;
  play: () => void;
  pause: () => void;
  seek: (position: number) => void;
  getPosition: () => number;
  setPlaylist: (songs: Song[]) => void;
  playSong: (song: Song, playlist?: Song[]) => Promise<void>;
  playPrev: () => Promise<void>;
  playNext: () => Promise<void>;
  toggleLoop: () => void;
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

  const queryClient = useQueryClient();

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [isLooping, setIsLooping] = useState(false);
  const isLoopingRef = useRef(false);

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => {
      isLoopingRef.current = !prev;
      return !prev;
    });
  }, []);

  const playNextRef = useRef<(() => Promise<void>) | undefined>(undefined);

  const currentIndex = useMemo(() => {
    return playlist.findIndex((song) => song.id === currentSong?.id);
  }, [playlist, currentSong?.id]);

  const playSong = useCallback(
    async (song: Song, newPlaylist?: Song[]): Promise<void> => {
      if (newPlaylist) {
        setPlaylist(newPlaylist);
      }

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

      // Briefly patch the Audio constructor so Howler creates the <audio> element
      // with crossOrigin="anonymous" already set. Web Audio API's
      // createMediaElementSource (used by @audiowave/react) requires this to be
      // present before the src is loaded, otherwise the analyser sees only zeros.
      const OrigAudio = window.Audio;
      (window as unknown as Record<string, unknown>).Audio = function (
        ...args: unknown[]
      ) {
        const el = new OrigAudio(
          ...(args as ConstructorParameters<typeof Audio>),
        );
        el.crossOrigin = "anonymous";
        return el;
      };

      load(song.file_url, {
        autoplay: true,
        format: "mp3",
        html5: true,
        onend: () => {
          if (isLoopingRef.current) {
            seek(0);
            play();
          } else {
            void playNextRef.current?.();
          }
        },
        onplay: () => {
          try {
            void logPlay(song.id);
            // Invalidate all play-history pages so PlayHistory refetches automatically
            void queryClient.invalidateQueries({
              queryKey: ["playHistory"],
            });
          } catch (err) {
            console.error("Failed to log play:", err);
          }
        },
      });

      // Restore immediately - Howler creates the element synchronously above
      (window as unknown as { Audio: typeof Audio }).Audio = OrigAudio;
    },
    [currentSong?.id, isPlaying, load, pause, play, queryClient, seek, stop],
  );

  const playPrev = useCallback(async (): Promise<void> => {
    if (!playlist.length) return;
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
    await playSong(playlist[prevIndex]);
  }, [currentIndex, playlist, playSong]);

  const playNext = useCallback(async (): Promise<void> => {
    if (!playlist.length) return;
    const nextIndex =
      currentIndex >= 0 && currentIndex < playlist.length - 1
        ? currentIndex + 1
        : 0;
    await playSong(playlist[nextIndex]);
  }, [currentIndex, playlist, playSong]);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  const contextValue = useMemo(
    () => ({
      currentSong,
      playlist,
      isPlaying,
      isLoading,
      isLooping,
      duration,
      play,
      pause,
      seek,
      getPosition,
      setPlaylist,
      playSong,
      playPrev,
      playNext,
      toggleLoop,
    }),
    [
      currentSong,
      playlist,
      isPlaying,
      isLoading,
      isLooping,
      duration,
      play,
      pause,
      seek,
      getPosition,
      playSong,
      playPrev,
      playNext,
      toggleLoop,
    ],
  );

  return (
    <PlayerContext.Provider value={contextValue}>
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
