import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlayerProvider, usePlayer } from "./PlayerContext";
import { logPlay } from "@/features/player/api";
import type { Song } from "@/features/songs/types";

let loadCallbacks: { onplay?: () => void; onend?: () => void } = {};

const mockAudioPlay = vi.fn();
const mockAudioPause = vi.fn();
const mockStop = vi.fn();
const mockLoad = vi.fn((src, options) => {
  loadCallbacks = options || {};
});
const mockGetPosition = vi.fn(() => 42);
const mockSeek = vi.fn();
const mockSetVolume = vi.fn();

vi.mock("react-use-audio-player", () => ({
  useAudioPlayer: () => ({
    play: mockAudioPlay,
    pause: mockAudioPause,
    stop: mockStop,
    isPlaying: false,
    isLoading: false,
    load: mockLoad,
    getPosition: mockGetPosition,
    seek: mockSeek,
    duration: 321,
    setVolume: mockSetVolume,
  }),
}));

vi.mock("@/features/player/api", () => ({
  logPlay: vi.fn(),
}));

const mockedLogPlay = vi.mocked(logPlay);

const songA: Song = {
  id: 1,
  title: "Song A",
  artist: "Artist A",
  file_url: "https://songs/a.mp3",
  duration: 120,
  cover_art_url: "https://placehold.co/220",
  uploaded_at: "2024-01-01T00:00:00Z",
};
const songB: Song = {
  id: 2,
  title: "Song B",
  artist: "Artist B",
  file_url: "https://songs/b.mp3",
  duration: 130,
  cover_art_url: "https://placehold.co/220",
  uploaded_at: "2024-01-01T00:00:00Z",
};
const songC: Song = {
  id: 3,
  title: "Song C",
  artist: "Artist C",
  file_url: "https://songs/c.mp3",
  duration: 140,
  cover_art_url: "https://placehold.co/220",
  uploaded_at: "2024-01-01T00:00:00Z",
};

const setup = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <PlayerProvider>{children}</PlayerProvider>
    </QueryClientProvider>
  );

  const { result } = renderHook(() => usePlayer(), { wrapper });
  return { result, invalidateSpy };
};

describe("PlayerContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedLogPlay.mockResolvedValue(undefined);
    loadCallbacks = {};
  });

  describe("Provider guard", () => {
    it("throws if usePlayer is used outside provider", () => {
      expect(() => renderHook(() => usePlayer())).toThrow(
        "usePlayer must be used within PlayerProvider",
      );
    });
  });

  describe("Basic controls", () => {
    it("forwards play, pause, seek, and setVolume to audio player", () => {
      const { result } = setup();

      act(() => result.current.play());
      expect(mockAudioPlay).toHaveBeenCalled();

      act(() => result.current.pause());
      expect(mockAudioPause).toHaveBeenCalled();

      act(() => result.current.seek(25));
      expect(mockSeek).toHaveBeenCalledWith(25);

      act(() => result.current.setVolume(0.4));
      expect(mockSetVolume).toHaveBeenCalledWith(0.4);
      expect(result.current.volume).toBe(0.4);

      act(() => {
        result.current.getPosition();
      });
      expect(mockGetPosition).toHaveBeenCalled();
    });

    it("toggles looping state", () => {
      const { result } = setup();
      expect(result.current.isLooping).toBe(false);

      act(() => result.current.toggleLoop());
      expect(result.current.isLooping).toBe(true);
    });
  });

  describe("Playback flow", () => {
    it("loads a new song, updates playlist, and logs play history on onplay callback", async () => {
      const { result, invalidateSpy } = setup();

      await act(async () => {
        await result.current.playSong(songA, [songA, songB, songC]);
      });

      expect(result.current.playlist).toEqual([songA, songB, songC]);
      expect(mockStop).toHaveBeenCalled();
      expect(mockLoad).toHaveBeenCalledWith(
        "https://songs/a.mp3",
        expect.objectContaining({
          autoplay: true,
          format: "mp3",
          html5: true,
          initialVolume: 1,
        }),
      );

      act(() => {
        loadCallbacks.onplay?.();
      });

      await waitFor(() => {
        expect(mockedLogPlay).toHaveBeenCalledWith(1);
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["playHistory"] });
      expect(result.current.currentSong?.id).toBe(1);
    });

    it("restarts current song without stopping/loading again", async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.playSong(songA);
      });

      mockStop.mockClear();
      mockLoad.mockClear();
      mockSeek.mockClear();
      mockAudioPlay.mockClear();

      await act(async () => {
        await result.current.playSong(songA);
      });

      expect(mockSeek).toHaveBeenCalledWith(0);
      expect(mockAudioPlay).toHaveBeenCalled();
      expect(mockStop).not.toHaveBeenCalled();
      expect(mockLoad).not.toHaveBeenCalled();
    });

    it("supports playPrev/playNext and wraps around playlist", async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.playSong(songA, [songA, songB, songC]);
      });

      mockLoad.mockClear();
      await act(async () => {
        await result.current.playPrev();
      });
      expect(mockLoad).toHaveBeenCalledWith(
        "https://songs/c.mp3",
        expect.any(Object),
      );

      mockLoad.mockClear();
      await act(async () => {
        await result.current.playNext();
      });
      expect(mockLoad).toHaveBeenCalledWith(
        "https://songs/a.mp3",
        expect.any(Object),
      );
    });
  });

  describe("onend behavior", () => {
    it("replays same song when loop is enabled", async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.playSong(songA);
        result.current.toggleLoop();
      });

      mockSeek.mockClear();
      mockAudioPlay.mockClear();
      mockLoad.mockClear();

      act(() => {
        loadCallbacks.onend?.();
      });

      expect(mockSeek).toHaveBeenCalledWith(0);
      expect(mockAudioPlay).toHaveBeenCalled();
      expect(mockLoad).not.toHaveBeenCalled();
    });

    it("plays next track when loop is disabled", async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.playSong(songA, [songA, songB]);
      });

      mockLoad.mockClear();

      await act(async () => {
        loadCallbacks.onend?.();
      });

      expect(mockLoad).toHaveBeenCalledWith(
        "https://songs/b.mp3",
        expect.any(Object),
      );
    });
  });
});
