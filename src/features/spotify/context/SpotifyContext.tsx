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
import { getValidAccessToken, clearCachedToken } from "../auth";
import { playOnDevice } from "../api";
import type { SpotifySDKPlayer, SpotifyPlayerState } from "../types";

export interface SpotifyContextType {
  /** True once the SDK script has loaded and the player is connected. */
  isReady: boolean;
  /** True while SDK is buffering/loading a track. */
  isLoading: boolean;
  /** True if a Spotify track is currently playing. */
  isPlaying: boolean;

  /** Current track duration in seconds. */
  duration: number;
  /**
   * Returns current playback position in seconds.
   * Interpolates from last SDK state so it works synchronously every frame.
   */
  getPosition: () => number;

  /** Play a Spotify URI ("spotify:track:...") on the SDK device. */
  playTrack: (uri: string) => Promise<void>;
  /**
   * Register a callback fired when the current track ends naturally
   * (i.e. not from a user pause). Used by PlayerContext to advance the playlist.
   */
  setOnTrackEnded: (cb: (() => void) | null) => void;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (positionSeconds: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  nextTrack: () => Promise<void>;
  prevTrack: () => Promise<void>;
}

const SpotifyContext = createContext<SpotifyContextType | undefined>(undefined);

// ── Helper ─────────────────────────────────────────────────────────────────────

const SDK_SCRIPT_ID = "spotify-playback-sdk";

let sdkPromise: Promise<void> | null = null;

const loadSdkScript = (): Promise<void> => {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve) => {
    if (window.Spotify) {
      resolve();
      return;
    }

    const existingCallback = window.onSpotifyWebPlaybackSDKReady;
    window.onSpotifyWebPlaybackSDKReady = () => {
      existingCallback?.();
      resolve();
    };

    if (!document.getElementById(SDK_SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SDK_SCRIPT_ID;
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }
  });

  return sdkPromise;
};

// ── Provider ──────────────────────────────────────────────────────────────────

export const SpotifyProvider = ({ children }: { children: ReactNode }) => {
  const playerRef = useRef<SpotifySDKPlayer | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const onTrackEndedRef = useRef<(() => void) | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0); // seconds

  // Smooth position interpolation: store last known state
  const positionRef = useRef({ positionMs: 0, timestampMs: 0, paused: true });

  const getPosition = useCallback((): number => {
    const { positionMs, timestampMs, paused } = positionRef.current;
    if (paused) return positionMs / 1000;
    return (positionMs + (Date.now() - timestampMs)) / 1000;
  }, []);

  // ── SDK initialisation ──────────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      console.log("[Spotify] loading SDK script…");
      await loadSdkScript();
      if (!mounted) return;
      console.log("[Spotify] SDK ready, creating player…");

      const player = new window.Spotify.Player({
        name: "Music App",
        getOAuthToken: (cb) => {
          console.log(
            "[Spotify] getOAuthToken called — fetching token from backend…",
          );
          void getValidAccessToken().then((token) => {
            if (token) {
              console.log("[Spotify] token obtained ✓");
              cb(token);
            } else {
              console.error(
                "[Spotify] getOAuthToken: no token returned from backend",
              );
            }
          });
        },
        volume: 1,
      });

      player.addListener("ready", (data) => {
        const { device_id } = data as { device_id: string };
        console.log("[Spotify] player ready, device_id:", device_id);
        deviceIdRef.current = device_id;
        setIsReady(true);
      });

      player.addListener("not_ready", (data) => {
        console.warn("[Spotify] player not ready:", data);
        setIsReady(false);
      });

      player.addListener("player_state_changed", (rawState) => {
        if (!rawState) return;
        const state = rawState as SpotifyPlayerState;

        // Detect natural track end: was playing, near end, now paused at pos 0
        const prevPosMs = positionRef.current.positionMs;
        const wasPlaying = !positionRef.current.paused;
        const prevDuration = state.duration;
        const wasNearEnd = prevDuration > 0 && prevPosMs > prevDuration - 4000;
        const nowPausedAtStart = state.paused && state.position < 1500;
        if (wasPlaying && wasNearEnd && nowPausedAtStart) {
          onTrackEndedRef.current?.();
        }

        setIsPlaying(!state.paused);
        setIsLoading(false);
        setDuration(state.duration / 1000);
        positionRef.current = {
          positionMs: state.position,
          timestampMs: Date.now(),
          paused: state.paused,
        };
      });

      player.addListener("initialization_error", (e) =>
        console.error("[Spotify] init error", e),
      );
      player.addListener("authentication_error", (e) => {
        console.error(
          "[Spotify] authentication error — token may be invalid:",
          e,
        );
        clearCachedToken();
      });
      player.addListener("account_error", (e) =>
        console.error("[Spotify] account error — Premium required", e),
      );

      console.log("[Spotify] calling player.connect()…");
      const connected = await player.connect();
      console.log("[Spotify] player.connect() resolved:", connected);
      playerRef.current = player;
    };

    void init();

    return () => {
      mounted = false;
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
      setIsReady(false);
    };
  }, []);

  // ── Playback ────────────────────────────────────────────────────────────────

  const playTrack = useCallback(async (uri: string): Promise<void> => {
    const deviceId = deviceIdRef.current;
    if (!deviceId) throw new Error("Spotify player not ready.");
    setIsLoading(true);
    await playOnDevice(uri, deviceId);
  }, []);

  const pause = useCallback(async () => {
    await playerRef.current?.pause();
    setIsPlaying(false);
    positionRef.current = {
      ...positionRef.current,
      positionMs:
        positionRef.current.positionMs +
        (Date.now() - positionRef.current.timestampMs),
      timestampMs: Date.now(),
      paused: true,
    };
  }, []);

  const resume = useCallback(async () => {
    await playerRef.current?.resume();
  }, []);

  const seek = useCallback(async (positionSeconds: number) => {
    await playerRef.current?.seek(positionSeconds * 1000);
    positionRef.current = {
      positionMs: positionSeconds * 1000,
      timestampMs: Date.now(),
      paused: positionRef.current.paused,
    };
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    await playerRef.current?.setVolume(volume);
  }, []);

  const nextTrack = useCallback(async () => {
    await playerRef.current?.nextTrack();
  }, []);

  const prevTrack = useCallback(async () => {
    await playerRef.current?.previousTrack();
  }, []);

  const setOnTrackEnded = useCallback((cb: (() => void) | null) => {
    onTrackEndedRef.current = cb;
  }, []);

  // ── Context value ──────────────────────────────────────────────────────────

  const value = useMemo(
    () => ({
      isReady,
      isLoading,
      isPlaying,
      duration,
      getPosition,
      playTrack,
      setOnTrackEnded,
      pause,
      resume,
      seek,
      setVolume,
      nextTrack,
      prevTrack,
    }),
    [
      isReady,
      isLoading,
      isPlaying,
      duration,
      getPosition,
      playTrack,
      setOnTrackEnded,
      pause,
      resume,
      seek,
      setVolume,
      nextTrack,
      prevTrack,
    ],
  );

  return (
    <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>
  );
};

export const useSpotify = (): SpotifyContextType => {
  const ctx = useContext(SpotifyContext);
  if (!ctx) throw new Error("useSpotify must be used within SpotifyProvider");
  return ctx;
};
