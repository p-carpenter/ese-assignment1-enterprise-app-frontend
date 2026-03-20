import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExpandedPlayer } from "./ExpandedPlayer";
import { useIsOverflowing } from "@/features/player/hooks";
import {
  PlaybackControls,
  usePlayer,
  WaveProgressBar,
  SongMeta,
  PlaybackTimeDisplay,
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
  PlayHistory: vi.fn(() => <div data-testid="play-history" />),
  SongMeta: vi.fn(() => <div data-testid="song-meta" />),
  PlaybackTimeDisplay: vi.fn(() => <div data-testid="playback-time" />),
}));

vi.mock("@/features/songs/pages/SongDetailsPage/components", () => ({
  LyricsSection: vi.fn(() => <div data-testid="lyrics-section" />),
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
    it("renders core player components and headers", () => {
      render(<ExpandedPlayer onCollapse={mockOnCollapse} />);

      expect(screen.getByText("Now Playing")).toBeInTheDocument();
      expect(screen.getByTestId("song-meta")).toBeInTheDocument();
      expect(screen.getByTestId("wave-progress")).toBeInTheDocument();
      expect(screen.getByTestId("playback-time")).toBeInTheDocument();
      expect(screen.getByTestId("playback-controls")).toBeInTheDocument();
    });

    it("passes expanded flags and overflow states to child components", () => {
      vi.mocked(useIsOverflowing)
        .mockReturnValueOnce(true) // titleRef
        .mockReturnValueOnce(false); // artistRef

      render(<ExpandedPlayer onCollapse={mockOnCollapse} />);

      expect(vi.mocked(SongMeta)).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isScrolling: true,
          isArtistScrolling: false,
          isExpanded: true,
        }),
        undefined,
      );

      expect(vi.mocked(PlaybackControls)).toHaveBeenLastCalledWith(
        expect.objectContaining({ isExpanded: true }),
        undefined,
      );

      expect(vi.mocked(WaveProgressBar)).toHaveBeenLastCalledWith(
        expect.objectContaining({ isExpanded: true }),
        undefined,
      );
    });

    it("should have no accessibility violations", async () => {
      const { container } = render(
        <ExpandedPlayer onCollapse={mockOnCollapse} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Edge Cases", () => {
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

    it("calculates maxDuration correctly from currentSong if context duration is missing", () => {
      vi.mocked(usePlayer).mockReturnValue(
        makePlayerState({
          duration: undefined,
          currentSong: makeSong({ duration: 345 }),
        }),
      );
      render(<ExpandedPlayer onCollapse={mockOnCollapse} />);

      expect(vi.mocked(PlaybackTimeDisplay)).toHaveBeenLastCalledWith(
        expect.objectContaining({ maxDuration: 345 }),
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

    it("wires up all playback callbacks properly to child components", () => {
      const state = makePlayerState();
      vi.mocked(usePlayer).mockReturnValue(state);

      render(<ExpandedPlayer onCollapse={mockOnCollapse} />);

      // Extract the props passed to the mocks
      const playbackProps = vi.mocked(PlaybackControls).mock.lastCall![0];
      const waveProps = vi.mocked(WaveProgressBar).mock.lastCall![0];

      // Fire them manually to ensure they hit the context state functions
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
  });

  describe("Core Interactions", () => {
    it("calls onCollapse when the top chevron is clicked", async () => {
      const user = userEvent.setup();
      render(<ExpandedPlayer onCollapse={mockOnCollapse} />);

      await user.click(screen.getByRole("button", { name: "Collapse player" }));
      expect(mockOnCollapse).toHaveBeenCalledTimes(1);
    });

    it("toggles loop state via the RAC ToggleButton", async () => {
      const user = userEvent.setup();
      const toggleLoop = vi.fn();
      vi.mocked(usePlayer).mockReturnValue(
        makePlayerState({ isLooping: false, toggleLoop }),
      );

      render(<ExpandedPlayer onCollapse={mockOnCollapse} />);

      const loopBtn = screen.getByRole("button", { name: "Loop playback" });
      expect(loopBtn).toHaveAttribute("aria-pressed", "false");

      await user.click(loopBtn);

      expect(toggleLoop).toHaveBeenCalledTimes(1);
    });
  });

  describe("RAC Modals and Popovers", () => {
    it("opens and closes the Play History popover", async () => {
      const user = userEvent.setup();
      render(<ExpandedPlayer onCollapse={mockOnCollapse} />);

      // Popover should not exist initially
      expect(
        screen.queryByRole("dialog", { name: "Play History" }),
      ).not.toBeInTheDocument();

      // Open popover
      await user.click(
        screen.getByRole("button", { name: "Toggle play history" }),
      );
      expect(
        screen.getByRole("dialog", { name: "Play History" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("play-history")).toBeInTheDocument();

      // Close popover
      await user.click(screen.getByRole("button", { name: "Close history" }));
      expect(
        screen.queryByRole("dialog", { name: "Play History" }),
      ).not.toBeInTheDocument();
    });

    it("opens and closes the Lyrics modal", async () => {
      const user = userEvent.setup();
      render(<ExpandedPlayer onCollapse={mockOnCollapse} />);

      // Modal should not exist initially
      expect(
        screen.queryByRole("dialog", { name: "Lyrics" }),
      ).not.toBeInTheDocument();

      // Open modal
      await user.click(screen.getByRole("button", { name: /Lyrics/i }));

      const modal = screen.getByRole("dialog", { name: "Lyrics" });
      expect(modal).toBeInTheDocument();
      expect(screen.getByTestId("lyrics-section")).toBeInTheDocument();

      // Close modal
      await user.click(screen.getByRole("button", { name: "Close lyrics" }));
      expect(
        screen.queryByRole("dialog", { name: "Lyrics" }),
      ).not.toBeInTheDocument();
    });

    it("does not render LyricsSection inside the modal if there is no currentSong", async () => {
      const user = userEvent.setup();
      vi.mocked(usePlayer).mockReturnValue(
        makePlayerState({ currentSong: null }),
      );

      render(<ExpandedPlayer onCollapse={mockOnCollapse} />);

      await user.click(screen.getByRole("button", { name: /Lyrics/i }));

      expect(
        screen.getByRole("dialog", { name: "Lyrics" }),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("lyrics-section")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles the case where both context duration and song duration are missing", () => {
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

    it("ensures ToggleButton reflects the correct isLooping state", () => {
      const { rerender } = render(
        <ExpandedPlayer onCollapse={mockOnCollapse} />,
      );

      const loopBtn = screen.getByRole("button", { name: "Loop playback" });
      expect(loopBtn).toHaveAttribute("aria-pressed", "false");

      vi.mocked(usePlayer).mockReturnValue(
        makePlayerState({ isLooping: true }),
      );
      rerender(<ExpandedPlayer onCollapse={mockOnCollapse} />);

      expect(loopBtn).toHaveAttribute("aria-pressed", "true");
    });

    it("verifies the lyrics section doesn't crash if currentSong properties are missing", async () => {
      const user = userEvent.setup();
      // A song that technically exists but is empty.
      vi.mocked(usePlayer).mockReturnValue(
        makePlayerState({
          currentSong: { id: 1 } as Song,
        }),
      );

      render(<ExpandedPlayer onCollapse={mockOnCollapse} />);
      await user.click(screen.getByRole("button", { name: /Lyrics/i }));

      expect(
        screen.getByRole("dialog", { name: "Lyrics" }),
      ).toBeInTheDocument();

      expect(screen.getByTestId("lyrics-section")).toBeInTheDocument();
    });
  });
});
