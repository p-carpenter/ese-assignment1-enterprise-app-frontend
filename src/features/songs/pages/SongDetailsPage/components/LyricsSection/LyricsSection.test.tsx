import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LyricsSection } from "./LyricsSection";
import { usePlayer } from "@/features/player";
import type { PlayerContextType } from "@/shared/context/PlayerContext";
import { useLyrics } from "../../../../hooks/useLyrics";

vi.mock("@/features/player", () => ({ usePlayer: vi.fn() }));
vi.mock("../../../../hooks/useLyrics", () => ({ useLyrics: vi.fn() }));

// Mock the exact path imported by LyricsSection.
vi.mock("../SyncedLyrics/SyncedLyrics", () => ({
  SyncedLyrics: () => <div data-testid="synced-lyrics" />,
}));

const createPlayerContext = (
  overrides: Partial<PlayerContextType> = {},
): PlayerContextType => ({
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
  playSong: vi.fn(async () => {}),
  playPrev: vi.fn(async () => {}),
  playNext: vi.fn(async () => {}),
  toggleLoop: vi.fn(),
  ...overrides,
});

const createLyricsResult = (
  overrides: Partial<ReturnType<typeof useLyrics>> = {},
): ReturnType<typeof useLyrics> => ({
  isLoading: false,
  isError: false,
  notFound: false,
  plainLyrics: null,
  syncedLines: null,
  ...overrides,
});

describe("LyricsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let rafCalls = 0;
    // Use typed RAF mocks to avoid callback signature issues.
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(
      (cb: FrameRequestCallback) => {
        rafCalls += 1;
        if (rafCalls === 1) cb(0);
        return rafCalls;
      },
    );
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading text while lyrics are being fetched", () => {
    vi.mocked(usePlayer).mockReturnValue(
      createPlayerContext({
        currentSong: null,
        getPosition: vi.fn(() => 0),
      }),
    );

    vi.mocked(useLyrics).mockReturnValue(
      createLyricsResult({
        isLoading: true,
      }),
    );

    render(<LyricsSection song={{ id: 1, artist: "A", title: "B" }} />);
    expect(screen.getByText("Searching for lyrics…")).toBeInTheDocument();
  });

  it("renders synced lyrics when the song is active and synced lines exist", () => {
    vi.mocked(usePlayer).mockReturnValue(
      createPlayerContext({
        currentSong: {
          id: 1,
          title: "Current Song",
          artist: "A",
          file_url: "https://example.com/current.mp3",
          duration: 120,
          uploaded_at: "2024-01-01T00:00:00Z",
        },
        getPosition: vi.fn(() => 10),
      }),
    );

    vi.mocked(useLyrics).mockReturnValue(
      createLyricsResult({
        syncedLines: [{ text: "Hello", time: 5 }],
      }),
    );

    render(<LyricsSection song={{ id: 1, artist: "A", title: "B" }} />);
    expect(screen.getByTestId("synced-lyrics")).toBeInTheDocument();
  });
});
