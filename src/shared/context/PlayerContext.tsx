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
import { useSpotify } from "@/features/spotify/context";

/** Returns true if the song's file_url is a Spotify track URL. */
const isSpotifyTrack = (song: Song | null): boolean =>
  !!song?.file_url?.startsWith("https://open.spotify.com/track/");

/** Converts an open.spotify.com track URL to a spotify:track: URI for the SDK. */
const toSpotifyUri = (fileUrl: string): string => {
  const trackId = fileUrl.split("/").pop() ?? "";
  return `spotify:track:${trackId}`;
};

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

  const {
    isReady: spotifyIsReady,
    isPlaying: spotifyIsPlaying,
    isLoading: spotifyIsLoading,
    duration: spotifyDuration,
    getPosition: spotifyGetPosition,
    playTrack: spotifyPlayTrack,
    setOnTrackEnded,
    pause: spotifyPause,
    resume: spotifyResume,
    seek: spotifySeek,
    setVolume: spotifySetVolume,
  } = useSpotify();

  const queryClient = useQueryClient();

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [isLooping, setIsLooping] = useState(false);
  const isLoopingRef = useRef(false);
  const [volume, setVolumeState] = useState(1);
  const volumeRef = useRef(1);

  const isCurrentSpotify = isSpotifyTrack(currentSong);

  const isPlaying = isCurrentSpotify ? spotifyIsPlaying : audioIsPlaying;
  const isLoading = isCurrentSpotify ? spotifyIsLoading : audioIsLoading;
  const duration = isCurrentSpotify ? spotifyDuration : audioDuration;
  const getPosition = isCurrentSpotify ? spotifyGetPosition : audioGetPosition;

  const seek = useCallback(
    (position: number) => {
      if (isCurrentSpotify) void spotifySeek(position);
      else audioSeek(position);
    },
    [isCurrentSpotify, spotifySeek, audioSeek],
  );

  const play = useCallback(() => {
    if (isCurrentSpotify) void spotifyResume();
    else audioPlay();
  }, [isCurrentSpotify, spotifyResume, audioPlay]);

  const pause = useCallback(() => {
    if (isCurrentSpotify) void spotifyPause();
    else audioPause();
  }, [isCurrentSpotify, spotifyPause, audioPause]);

  const setVolume = useCallback(
    (v: number) => {
      volumeRef.current = v;
      setVolumeState(v);
      audioSetVolume(v);
      void spotifySetVolume(v);
    },
    [audioSetVolume, spotifySetVolume],
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
        seek(0);
        play();
        return;
      }

      if (isCurrentSpotify) {
        void spotifyPause().catch(() => {});
      } else {
        stop();
      }

      setCurrentSong(song);

      if (isSpotifyTrack(song)) {
        // ── Spotify playback ─────────────────────────────────────────────────
        if (!spotifyIsReady) {
          console.error(
            "spotify player is not ready. du må deaktivere ui-knappene når den laster.",
          );
          return;
        }
        await spotifyPlayTrack(toSpotifyUri(song.file_url));
        await logPlay(song.id);
        void queryClient.invalidateQueries({ queryKey: ["playHistory"] });
      } else {
        // ── HTML5 audio playback ──────────────────────────────────────────────
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
      }
    },
    [
      currentSong?.id,
      isCurrentSpotify,
      load,
      play,
      queryClient,
      audioSeek,
      audioPlay,
      stop,
      spotifyIsReady,
      spotifyPlayTrack,
      spotifyPause,
      seek,
    ],
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
    if (isCurrentSpotify) {
      setOnTrackEnded(() => {
        if (isLoopingRef.current) {
          void spotifySeek(0).then(() => void spotifyResume());
        } else {
          void playNextRef.current?.();
        }
      });
    } else {
      setOnTrackEnded(null);
    }
  }, [isCurrentSpotify, setOnTrackEnded, spotifySeek, spotifyResume]);

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
