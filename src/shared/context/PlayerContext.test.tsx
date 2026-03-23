import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlayerProvider, usePlayer } from "./PlayerContext";
import { createSong } from "@/test/factories/song";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { resetHandlerState } from "@/mocks/handlers";

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

const songA = createSong({
  id: 1,
  title: "Song A",
  file_url: "https://songs/a.mp3",
});
const songB = createSong({
  id: 2,
  title: "Song B",
  file_url: "https://songs/b.mp3",
});
const songC = createSong({
  id: 3,
  title: "Song C",
  file_url: "https://songs/c.mp3",
});

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
    resetHandlerState();
    loadCallbacks = {};
  });

  describe("Playback flow", () => {
    it("loads a new song, updates playlist, and logs play history via MSW onplay callback", async () => {
      let historyLogCalled = false;
      server.use(
        http.post("http://localhost:8000/api/history/", () => {
          historyLogCalled = true;
          return HttpResponse.json({});
        }),
      );

      const { result, invalidateSpy } = setup();

      await act(async () => {
        await result.current.playSong(songA, [songA, songB, songC]);
      });

      expect(result.current.playlist).toEqual([songA, songB, songC]);
      expect(mockLoad).toHaveBeenCalledWith(
        "https://songs/a.mp3",
        expect.objectContaining({ autoplay: true }),
      );

      act(() => {
        loadCallbacks.onplay?.();
      });

      await waitFor(() => {
        expect(historyLogCalled).toBe(true);
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["playHistory"] });
      expect(result.current.currentSong?.id).toBe(1);
    });

    it("supports normal playNext progression", async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.playSong(songA, [songA, songB, songC]);
      });

      mockLoad.mockClear();
      await act(async () => {
        await result.current.playNext();
      });

      // Moving from index 0 (songA) to index 1 (songB).
      expect(mockLoad).toHaveBeenCalledWith(
        "https://songs/b.mp3",
        expect.any(Object),
      );
    });

    it("supports playPrev and wraps backward to the end of the playlist", async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.playSong(songA, [songA, songB, songC]);
      });

      mockLoad.mockClear();
      await act(async () => {
        await result.current.playPrev();
      });

      // Wrapping backward from index 0 (songA) to index 2 (songC).
      expect(mockLoad).toHaveBeenCalledWith(
        "https://songs/c.mp3",
        expect.any(Object),
      );
    });

    it("supports playNext and wraps forward to the start of the playlist", async () => {
      const { result } = setup();

      await act(async () => {
        // Start at the end of the playlist to test the forward wrap.
        await result.current.playSong(songC, [songA, songB, songC]);
      });

      mockLoad.mockClear();
      await act(async () => {
        await result.current.playNext();
      });

      // Wrapping forward from index 2 (songC) to index 0 (songA).
      expect(mockLoad).toHaveBeenCalledWith(
        "https://songs/a.mp3",
        expect.any(Object),
      );
    });

    it("restarts the song if playSong is called with the currently playing track", async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.playSong(songA, [songA]);
      });

      mockLoad.mockClear();
      mockSeek.mockClear();
      mockAudioPlay.mockClear();

      await act(async () => {
        await result.current.playSong(songA);
      });

      expect(mockSeek).toHaveBeenCalledWith(0);
      expect(mockAudioPlay).toHaveBeenCalled();
      expect(mockLoad).not.toHaveBeenCalled();
    });

    it("ignores playPrev and playNext if playlist is empty", async () => {
      const { result } = setup();

      await act(async () => {
        await result.current.playPrev();
        await result.current.playNext();
      });

      expect(mockLoad).not.toHaveBeenCalled();
    });
  });

  describe("Direct controls", () => {
    it("calls underlying audio player methods directly", () => {
      const { result } = setup();

      act(() => {
        result.current.play();
        result.current.pause();
        result.current.seek(50);
        result.current.setVolume(0.5);
      });

      expect(mockAudioPlay).toHaveBeenCalled();
      expect(mockAudioPause).toHaveBeenCalled();
      expect(mockSeek).toHaveBeenCalledWith(50);
      expect(mockSetVolume).toHaveBeenCalledWith(0.5);
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

  describe("Hook Usage", () => {
    it("throws an error when used outside of PlayerProvider", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => renderHook(() => usePlayer())).toThrow(
        "usePlayer must be used within PlayerProvider",
      );

      consoleSpy.mockRestore();
    });
  });
});
