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
import { useSpotify } from "@/features/spotify/SpotifyContext";

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

  const spotify = useSpotify();

  const queryClient = useQueryClient();

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [isLooping, setIsLooping] = useState(false);
  const isLoopingRef = useRef(false);
  const [volume, setVolumeState] = useState(1);
  const volumeRef = useRef(1);

  const isCurrentSpotify = isSpotifyTrack(currentSong);

  const isPlaying = isCurrentSpotify ? spotify.isPlaying : audioIsPlaying;
  const isLoading = isCurrentSpotify ? spotify.isLoading : audioIsLoading;
  const duration = isCurrentSpotify ? spotify.duration : audioDuration;
  const getPosition = isCurrentSpotify ? spotify.getPosition : audioGetPosition;

  const seek = useCallback(
    (position: number) => {
      if (isCurrentSpotify) void spotify.seek(position);
      else audioSeek(position);
    },
    [isCurrentSpotify, spotify, audioSeek],
  );

  const play = useCallback(() => {
    if (isCurrentSpotify) void spotify.resume();
    else audioPlay();
  }, [isCurrentSpotify, spotify, audioPlay]);

  const pause = useCallback(() => {
    if (isCurrentSpotify) void spotify.pause();
    else audioPause();
  }, [isCurrentSpotify, spotify, audioPause]);

  const setVolume = useCallback(
    (v: number) => {
      volumeRef.current = v;
      setVolumeState(v);
      audioSetVolume(v);
      void spotify.setVolume(v);
    },
    [audioSetVolume, spotify],
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
        if (isPlaying) {
          pause();
        } else {
          play();
        }
        return;
      }

      // Stop whichever engine is currently active
      if (isCurrentSpotify) {
        void spotify.pause().catch(() => {});
      } else {
        stop();
      }

      setCurrentSong(song);

      if (isSpotifyTrack(song)) {
        // ── Spotify playback ─────────────────────────────────────────────────
        if (!spotify.isReady) {
          console.warn("Spotify player not ready yet.");
          return;
        }
        await spotify.playTrack(toSpotifyUri(song.file_url));
        await logPlay(song.id);
        void queryClient.invalidateQueries({ queryKey: ["playHistory"] });
      } else {
        // ── HTML5 audio playback (Cloudinary / any URL) ───────────────────
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
      isPlaying,
      load,
      pause,
      play,
      queryClient,
      audioSeek,
      audioPlay,
      stop,
      spotify,
    ],
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

  // Register the "track ended" callback with SpotifyContext so it can
  // auto-advance the playlist when a Spotify song finishes naturally.
  useEffect(() => {
    if (isCurrentSpotify) {
      spotify.setOnTrackEnded(() => {
        if (isLoopingRef.current) {
          void spotify.seek(0).then(() => void spotify.resume());
        } else {
          void playNextRef.current?.();
        }
      });
    } else {
      spotify.setOnTrackEnded(null);
    }
  }, [isCurrentSpotify, spotify]);

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
