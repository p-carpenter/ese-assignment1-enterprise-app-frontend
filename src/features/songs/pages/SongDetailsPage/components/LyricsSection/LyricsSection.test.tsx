import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LyricsSection } from "./LyricsSection";
import { usePlayer } from "@/features/player/components";
import { useLyrics } from "../../../../hooks/useLyrics";
import type { PlayerContextType } from "@/shared/context/PlayerContext";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

vi.mock("@/features/player/components", () => ({ usePlayer: vi.fn() }));
vi.mock("../../../../hooks/useLyrics", () => ({ useLyrics: vi.fn() }));

vi.mock("../SyncedLyrics/SyncedLyrics", () => ({
  SyncedLyrics: ({ position }: { position: number }) => (
    <div data-testid="synced-lyrics" data-pos={position} />
  ),
}));

type UseLyricsReturn = ReturnType<typeof useLyrics>;

const mockPlayer = (overrides: Partial<PlayerContextType> = {}) => {
  vi.mocked(usePlayer).mockReturnValue({
    currentSong: null,
    playlist: [],
    isPlaying: false,
    isLoading: false,
    isLooping: false,
    duration: 0,
    volume: 1,
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
    getPosition: vi.fn(() => 0),
    setVolume: vi.fn(),
    setPlaylist: vi.fn(),
    playSong: vi.fn(),
    playPrev: vi.fn(),
    playNext: vi.fn(),
    toggleLoop: vi.fn(),
    ...overrides,
  } as PlayerContextType);
};

const mockLyrics = (overrides: Partial<UseLyricsReturn> = {}) => {
  vi.mocked(useLyrics).mockReturnValue({
    isLoading: false,
    isError: false,
    notFound: false,
    plainLyrics: null,
    syncedLines: null,
    ...overrides,
  } as UseLyricsReturn);
};

describe("LyricsSection", () => {
  const dummySong = { id: 1, artist: "Artist", title: "Title" };

  let rafCalls = 0;

  beforeEach(() => {
    vi.clearAllMocks();
    rafCalls = 0;

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCalls++;
      // Only execute the frame callback on the very first call.
      // This prevents the infinite recursive loop while still updating state.
      if (rafCalls === 1) {
        cb(100);
      }
      return rafCalls;
    });

    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading text while lyrics are being fetched", () => {
    mockPlayer();
    mockLyrics({ isLoading: true });

    render(<LyricsSection song={dummySong} />);
    expect(screen.getByText("Searching for lyrics…")).toBeInTheDocument();
  });

  it("shows not found text when lyrics don't exist", () => {
    mockPlayer();
    mockLyrics({ notFound: true });

    render(<LyricsSection song={dummySong} />);
    expect(
      screen.getByText("No lyrics found for this song."),
    ).toBeInTheDocument();
  });

  it("renders plain lyrics when no synced lines exist", () => {
    mockPlayer();
    mockLyrics({ plainLyrics: "These are plain lyrics\nLine 2" });

    render(<LyricsSection song={dummySong} />);
    expect(
      screen.getByText("These are plain lyrics Line 2"),
    ).toBeInTheDocument();
  });

  it("renders plain lyrics even if synced lines exist but it is not the currently playing song", () => {
    mockPlayer({
      currentSong: {
        id: 99,
        title: "Other",
        artist: "Other",
        duration: 0,
        file_url: "",
        cover_art_url: "",
        uploaded_at: "",
      },
    });
    mockLyrics({
      plainLyrics: "Fallback plain text",
      syncedLines: [{ text: "Hello", time: 5 }],
    });

    render(<LyricsSection song={dummySong} />);

    expect(screen.getByText("Fallback plain text")).toBeInTheDocument();
    expect(screen.queryByTestId("synced-lyrics")).not.toBeInTheDocument();
  });

  it("renders synced lyrics when the song is active and synced lines exist", () => {
    mockPlayer({
      currentSong: {
        id: 1,
        title: "Title",
        artist: "Artist",
        duration: 0,
        file_url: "",
        cover_art_url: "",
        uploaded_at: "",
      },
      getPosition: vi.fn(() => 42),
    });
    mockLyrics({
      syncedLines: [{ text: "Hello", time: 5 }],
    });

    render(<LyricsSection song={dummySong} />);

    const syncedComponent = screen.getByTestId("synced-lyrics");
    expect(syncedComponent).toBeInTheDocument();
    expect(syncedComponent).toHaveAttribute("data-pos", "42");
  });

  it("renders only the section title if syncedLines is empty and there are no plain lyrics", () => {
    mockPlayer({
      currentSong: {
        id: 1,
        title: "Title",
        artist: "Artist",
        duration: 0,
        file_url: "",
        cover_art_url: "",
        uploaded_at: "",
      },
    });

    mockLyrics({
      isLoading: false,
      notFound: false,
      syncedLines: [],
      plainLyrics: null,
    });

    const { container } = render(<LyricsSection song={dummySong} />);

    expect(screen.getByRole("heading", { name: "Lyrics" })).toBeInTheDocument();

    expect(screen.queryByTestId("synced-lyrics")).not.toBeInTheDocument();

    expect(container.querySelector("pre")).not.toBeInTheDocument();
  });

  it("renders plain lyrics when the song IS active but only plain lyrics exist", () => {
    mockPlayer({
      currentSong: {
        id: 1,
        title: "Title",
        artist: "Artist",
        duration: 0,
        file_url: "",
        cover_art_url: "",
        uploaded_at: "",
      },
    });
    mockLyrics({
      syncedLines: null,
      plainLyrics: "Just some plain text",
    });

    render(<LyricsSection song={dummySong} />);

    // Should fallback to plain lyrics.
    expect(screen.getByText("Just some plain text")).toBeInTheDocument();
    expect(screen.queryByTestId("synced-lyrics")).not.toBeInTheDocument();

    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("falls back to plain lyrics if syncedLines is an empty array", () => {
    mockPlayer({
      currentSong: {
        id: 1,
        title: "Title",
        artist: "Artist",
        duration: 0,
        file_url: "",
        cover_art_url: "",
        uploaded_at: "",
      },
    });
    mockLyrics({
      syncedLines: [], 
      plainLyrics: "Fallback for empty array",
    });

    render(<LyricsSection song={dummySong} />);

    expect(screen.getByText("Fallback for empty array")).toBeInTheDocument();
    expect(screen.queryByTestId("synced-lyrics")).not.toBeInTheDocument();
  });

  it("stops syncing and swaps to plain lyrics if the active song changes", () => {
    mockPlayer({
      currentSong: {
        id: 1,
        title: "Title",
        artist: "Artist",
        duration: 0,
        file_url: "",
        cover_art_url: "",
        uploaded_at: "",
      },
    });
    mockLyrics({
      syncedLines: [{ text: "Hello", time: 5 }],
      plainLyrics: "Plain text background",
    });

    const { rerender } = render(<LyricsSection song={dummySong} />);

    // Synced lyrics are visible, rAF is running.
    expect(screen.getByTestId("synced-lyrics")).toBeInTheDocument();
    expect(window.requestAnimationFrame).toHaveBeenCalled();

    // Grab the current cancelAnimationFrame call count.
    const cancelCallsBefore = vi.mocked(window.cancelAnimationFrame).mock.calls
      .length;

    mockPlayer({
      currentSong: {
        id: 2,
        title: "Title",
        artist: "Artist",
        duration: 0,
        file_url: "",
        cover_art_url: "",
        uploaded_at: "",
      },
    });

    rerender(<LyricsSection song={dummySong} />);

    // Verify it swapped back to plain text.
    expect(screen.queryByTestId("synced-lyrics")).not.toBeInTheDocument();
    expect(screen.getByText("Plain text background")).toBeInTheDocument();

    const cancelCallsAfter = vi.mocked(window.cancelAnimationFrame).mock.calls
      .length;
    expect(cancelCallsAfter).toBeGreaterThan(cancelCallsBefore);
  });

  it("cleans up requestAnimationFrame on unmount", () => {
    mockPlayer({
      currentSong: {
        id: 1,
        title: "Title",
        artist: "Artist",
        duration: 0,
        file_url: "",
        cover_art_url: "",
        uploaded_at: "",
      },
    });
    mockLyrics({ syncedLines: [{ text: "Hello", time: 5 }] });

    const { unmount } = render(<LyricsSection song={dummySong} />);

    expect(window.requestAnimationFrame).toHaveBeenCalled();

    unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(
      expect.any(Number),
    );
  });

  it("should have no accessibility violations", async () => {
    const { container } = render(<LyricsSection song={dummySong} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
