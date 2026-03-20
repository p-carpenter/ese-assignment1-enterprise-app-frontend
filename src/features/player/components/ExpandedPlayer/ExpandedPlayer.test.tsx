import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExpandedPlayer } from "./ExpandedPlayer";
import { useIsOverflowing } from "@/features/player/hooks";
import {
  PlaybackControls,
  usePlayer,
  WaveProgressBar,
} from "..";
import type { Song } from "@/features/songs/types";
import type { PlayerContextType } from "@/shared/context/PlayerContext";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

vi.mock("@/features/player/hooks", () => ({
  useIsOverflowing: vi.fn(),
}));

vi.mock("..", () => ({
  usePlayer: vi.fn(),
  PlaybackControls: vi.fn(() => <div data-testid="playback-controls" />),
  WaveProgressBar: vi.fn(() => <div data-testid="wave-progress" />),
  SongMeta: vi.fn(() => <div data-testid="song-meta" />),
  PlaybackTimeDisplay: vi.fn(() => <div data-testid="playback-time" />),
}));

vi.mock("./HistoryPopover/HistoryPopover", () => ({
  HistoryPopover: vi.fn(() => <div data-testid="history-popover" />),
}));

vi.mock("./LyricsModal/LyricsModal", () => ({
  LyricsModal: vi.fn(() => <div data-testid="lyrics-modal" />),
}));

const makeSong = (overrides: Partial<Song> = {}): Song => ({
  id: 4,
  title: "Now Playing",
  artist: "Artist",
  duration: 210,
  file_url: "https://example.com/song.mp3",
  cover_art_url: "https://placehold.co/220",
  uploaded_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

const makePlayerState = (
  overrides: Partial<PlayerContextType> = {},
): PlayerContextType =>
  ({
    currentSong: makeSong(),
    isPlaying: false,
    isLoading: false,
    isLooping: false,
    duration: 200,
    play: vi.fn(),
    pause: vi.fn(),
    playPrev: vi.fn(),
    playNext: vi.fn(),
    seek: vi.fn(),
    getPosition: vi.fn(() => 10),
    toggleLoop: vi.fn(),
    ...overrides,
  }) as PlayerContextType;

describe("ExpandedPlayer", () => {
  const mockOnCollapse = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useIsOverflowing).mockReturnValue(false);
    vi.mocked(usePlayer).mockReturnValue(makePlayerState());
  });

  describe("Layout & Rendering", () => {
    it("renders core player components, overlays, and headers", () => {
      render(<ExpandedPlayer onCollapse={mockOnCollapse} />);

      expect(screen.getByText("Now Playing")).toBeInTheDocument();
      expect(screen.getByTestId("song-meta")).toBeInTheDocument();
      expect(screen.getByTestId("wave-progress")).toBeInTheDocument();
      expect(screen.getByTestId("playback-time")).toBeInTheDocument();
      expect(screen.getByTestId("playback-controls")).toBeInTheDocument();
      expect(screen.getByTestId("history-popover")).toBeInTheDocument();
      expect(screen.getByTestId("lyrics-modal")).toBeInTheDocument();
    });

    it("should have no accessibility violations", async () => {
      const { container } = render(
        <ExpandedPlayer onCollapse={mockOnCollapse} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("State & Edge Cases", () => {
    it("disables playback controls when player is loading", () => {
      vi.mocked(usePlayer).mockReturnValue(
        makePlayerState({ isLoading: true }),
      );
      render(<ExpandedPlayer onCollapse={mockOnCollapse} />);

      expect(vi.mocked(PlaybackControls)).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isLoading: true,
          disablePrev: true,
          disableNext: true,
        }),
        undefined,
      );
    });

    it("disables playback controls when maxDuration is zero or negative", () => {
      vi.mocked(usePlayer).mockReturnValue(
        makePlayerState({
          duration: 0,
          currentSong: makeSong({ duration: 0 }),
        }),
      );
      render(<ExpandedPlayer onCollapse={mockOnCollapse} />);

      expect(vi.mocked(PlaybackControls)).toHaveBeenLastCalledWith(
        expect.objectContaining({
          disablePrev: true,
          disableNext: true,
        }),
        undefined,
      );
    });

    it("handles cases where both context duration and song duration are missing", () => {
      vi.mocked(usePlayer).mockReturnValue(
        makePlayerState({
          duration: undefined,
          currentSong: makeSong({ duration: undefined }),
        }),
      );
      render(<ExpandedPlayer onCollapse={mockOnCollapse} />);

      expect(vi.mocked(PlaybackControls)).toHaveBeenLastCalledWith(
        expect.objectContaining({ disablePrev: true }),
        undefined,
      );
    });

    it("passes undefined to currentSong prop in WaveProgressBar if no song exists", () => {
      vi.mocked(usePlayer).mockReturnValue(
        makePlayerState({ currentSong: null }),
      );
      render(<ExpandedPlayer onCollapse={mockOnCollapse} />);

      expect(vi.mocked(WaveProgressBar)).toHaveBeenLastCalledWith(
        expect.objectContaining({ currentSong: undefined }),
        undefined,
      );
    });
  });

  describe("Core Interactions", () => {
    it("calls onCollapse when the top chevron is clicked", async () => {
      const user = userEvent.setup();
      render(<ExpandedPlayer onCollapse={mockOnCollapse} />);

      await user.click(screen.getByRole("button", { name: "Collapse player" }));
      expect(mockOnCollapse).toHaveBeenCalledTimes(1);
    });

    it("wires up all playback callbacks properly to child components", () => {
      const state = makePlayerState();
      vi.mocked(usePlayer).mockReturnValue(state);

      render(<ExpandedPlayer onCollapse={mockOnCollapse} />);

      const playbackProps = vi.mocked(PlaybackControls).mock.lastCall![0];
      const waveProps = vi.mocked(WaveProgressBar).mock.lastCall![0];

      playbackProps.onPlay();
      playbackProps.onPause();
      playbackProps.onPrev();
      playbackProps.onNext();
      waveProps.seek(42);

      expect(state.play).toHaveBeenCalledTimes(1);
      expect(state.pause).toHaveBeenCalledTimes(1);
      expect(state.playPrev).toHaveBeenCalledTimes(1);
      expect(state.playNext).toHaveBeenCalledTimes(1);
      expect(state.seek).toHaveBeenCalledWith(42);
    });

    it("toggles loop state and accurately reflects external isLooping changes", async () => {
      const user = userEvent.setup();
      const toggleLoop = vi.fn();
      
      vi.mocked(usePlayer).mockReturnValue(
        makePlayerState({ isLooping: false, toggleLoop }),
      );

      const { rerender } = render(<ExpandedPlayer onCollapse={mockOnCollapse} />);
      const loopBtn = screen.getByRole("button", { name: "Loop playback" });
      
      expect(loopBtn).toHaveAttribute("aria-pressed", "false");
      await user.click(loopBtn);
      expect(toggleLoop).toHaveBeenCalledTimes(1);

      // Verify it updates if state changes externally.
      vi.mocked(usePlayer).mockReturnValue(
        makePlayerState({ isLooping: true, toggleLoop }),
      );
      rerender(<ExpandedPlayer onCollapse={mockOnCollapse} />);
      expect(loopBtn).toHaveAttribute("aria-pressed", "true");
    });
  });
});