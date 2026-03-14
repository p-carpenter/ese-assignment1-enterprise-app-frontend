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
import { logPlay } from "@/features/player/api";
import { type Song } from "@/features/songs/types";

export interface PlayerContextType {
  currentSong: Song | null;
  playlist: Song[];
  isPlaying: boolean;
  isLoading: boolean;
  isLooping: boolean;
  duration: number;
  volume: number;
  play: () => void;
  pause: () => void;
  seek: (position: number) => void;
  getPosition: () => number;
  setVolume: (volume: number) => void;
  setPlaylist: (songs: Song[]) => void;
  playSong: (song: Song, playlist?: Song[]) => Promise<void>;
  playPrev: () => Promise<void>;
  playNext: () => Promise<void>;
  toggleLoop: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const {
    play: audioPlay,
    pause: audioPause,
    stop,
    isPlaying: audioIsPlaying,
    isLoading: audioIsLoading,
    load,
    getPosition: audioGetPosition,
    seek: audioSeek,
    duration: audioDuration,
    setVolume: audioSetVolume,
  } = useAudioPlayer();
  const queryClient = useQueryClient();

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [isLooping, setIsLooping] = useState(false);
  const isLoopingRef = useRef(false);
  const [volume, setVolumeState] = useState(1);
  const volumeRef = useRef(1);

  const isPlaying = audioIsPlaying;
  const isLoading = audioIsLoading;
  const duration = audioDuration;
  const getPosition = audioGetPosition;

  const seek = useCallback(
    (position: number) => {
      audioSeek(position);
    },
    [audioSeek],
  );

  const play = useCallback(() => {
    audioPlay();
  }, [audioPlay]);

  const pause = useCallback(() => {
    audioPause();
  }, [audioPause]);

  const setVolume = useCallback(
    (v: number) => {
      volumeRef.current = v;
      setVolumeState(v);
      audioSetVolume(v);
    },
    [audioSetVolume],
  );

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
        audioSeek(0);
        audioPlay();
        return;
      }

      stop();
      setCurrentSong(song);

      const handlePlay = async () => {
        await logPlay(song.id);
        void queryClient.invalidateQueries({ queryKey: ["playHistory"] });
      };

      load(song.file_url, {
        autoplay: true,
        format: "mp3",
        html5: true,
        initialVolume: volumeRef.current,
        onend: () => {
          if (isLoopingRef.current) {
            audioSeek(0);
            audioPlay();
          } else {
            void playNextRef.current?.();
          }
        },
        onplay: () => void handlePlay(),
      });
    },
    [currentSong?.id, load, audioSeek, audioPlay, stop, queryClient],
  );

  const playPrev = useCallback(async (): Promise<void> => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
    await playSong(playlist[prevIndex]);
  }, [currentIndex, playlist, playSong]);

  const playNext = useCallback(async (): Promise<void> => {
    const nextIndex =
      currentIndex >= 0 && currentIndex < playlist.length - 1
        ? currentIndex + 1
        : 0;
    await playSong(playlist[nextIndex]);
  }, [currentIndex, playlist, playSong]);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  useEffect(() => {
    // keep play-next ref up to date
  }, [playNext]);

  const contextValue = useMemo(
    () => ({
      currentSong,
      playlist,
      isPlaying,
      isLoading,
      isLooping,
      duration,
      volume,
      play,
      pause,
      seek,
      getPosition,
      setVolume,
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
      volume,
      play,
      pause,
      seek,
      getPosition,
      setVolume,
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
