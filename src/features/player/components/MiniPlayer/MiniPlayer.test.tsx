import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useNavigate } from "react-router-dom";
import { MiniPlayer } from "./MiniPlayer";
import { useIsOverflowing } from "../../hooks/useOverflow";
import { useMediaQuery } from "@/shared/hooks";
import { PlaybackControls, WaveProgressBar } from "..";
import { SongMeta, PlaybackTimeDisplay } from "../";
import { usePlayer } from "@/shared/context/PlayerContext";
import { createMockPlayer } from "@/test/factories/player";
import { createSong } from "@/test/factories/song";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: vi.fn() };
});

vi.mock("@/shared/hooks/useMediaQuery/useMediaQuery", () => ({
  useMediaQuery: vi.fn(),
}));

vi.mock("../../hooks/useOverflow", () => ({
  useIsOverflowing: vi.fn(),
}));

vi.mock("@/shared/context/PlayerContext", () => ({
  usePlayer: vi.fn(),
}));

vi.mock("../PlaybackControls/PlaybackControls", () => ({
  PlaybackControls: vi.fn(() => <div data-testid="playback-controls" />),
}));

vi.mock("../WaveProgressBar/WaveProgressBar", () => ({
  WaveProgressBar: vi.fn(() => <div data-testid="wave-progress" />),
}));

vi.mock("../PlayHistory/PlayHistory", () => ({
  PlayHistory: vi.fn(() => <div data-testid="play-history" />),
}));

vi.mock("../SongMeta/SongMeta", () => ({
  SongMeta: vi.fn(() => <div data-testid="song-meta" />),
}));

vi.mock("../PlaybackTimeDisplay/PlaybackTimeDisplay", () => ({
  PlaybackTimeDisplay: vi.fn(() => <div data-testid="playback-time" />),
}));

vi.mock("../VolumeBar/VolumeBar", () => ({
  VolumeBar: vi.fn(() => <div data-testid="volume-bar" />),
}));

describe("MiniPlayer", () => {
  const mockNavigate = vi.fn();
  const mockOnExpand = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useMediaQuery).mockReturnValue(false);
    vi.mocked(useIsOverflowing).mockReturnValue(false);
    vi.mocked(usePlayer).mockReturnValue(
      createMockPlayer({
        currentSong: createSong({ id: 4, title: "Now Playing", duration: 210 }),
        duration: 200,
        getPosition: vi.fn(() => 10),
      }),
    );
  });

  describe("Layout & Rendering", () => {
    it("renders all core child sections", () => {
      render(<MiniPlayer onExpand={mockOnExpand} />);

      expect(screen.getByTestId("song-meta")).toBeInTheDocument();
      expect(screen.getByTestId("playback-controls")).toBeInTheDocument();
      expect(screen.getByTestId("wave-progress")).toBeInTheDocument();
      expect(screen.getByTestId("playback-time")).toBeInTheDocument();
      expect(screen.getByTestId("volume-bar")).toBeInTheDocument();
    });

    it("passes correct overflow flags to SongMeta", () => {
      vi.mocked(useIsOverflowing)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      render(<MiniPlayer onExpand={mockOnExpand} />);

      expect(vi.mocked(SongMeta)).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isScrolling: false,
          isArtistScrolling: true,
          isExpanded: false,
        }),
        undefined,
      );
    });

    it("should have no accessibility violations", async () => {
      const { container } = render(<MiniPlayer onExpand={mockOnExpand} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Navigation & Meta Interaction", () => {
    it("navigates to song details on desktop when current song exists", async () => {
      const user = userEvent.setup();
      vi.mocked(useMediaQuery).mockReturnValue(false);

      render(<MiniPlayer onExpand={mockOnExpand} />);

      await user.click(
        screen.getByRole("button", { name: "View song details" }),
      );

      expect(mockNavigate).toHaveBeenCalledWith("/songs/4");
      expect(mockOnExpand).not.toHaveBeenCalled();
    });

    it("triggers onExpand on mobile instead of navigating", async () => {
      const user = userEvent.setup();
      vi.mocked(useMediaQuery).mockReturnValue(true);

      render(<MiniPlayer onExpand={mockOnExpand} />);

      await user.click(
        screen.getByRole("button", { name: "View song details" }),
      );

      expect(mockOnExpand).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Playback Controls", () => {
    it("disables controls when player is loading", () => {
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayer({ isLoading: true }),
      );
      render(<MiniPlayer onExpand={mockOnExpand} />);

      expect(vi.mocked(PlaybackControls)).toHaveBeenLastCalledWith(
        expect.objectContaining({
          isLoading: true,
          disablePrev: true,
          disableNext: true,
        }),
        undefined,
      );
    });

    it("disables controls when calculated maxDuration is zero", () => {
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayer({
          duration: 0,
          currentSong: createSong({ duration: 0 }),
        }),
      );

      render(<MiniPlayer onExpand={mockOnExpand} />);

      expect(vi.mocked(PlaybackControls)).toHaveBeenLastCalledWith(
        expect.objectContaining({ disablePrev: true, disableNext: true }),
        undefined,
      );
    });

    it("calculates maxDuration from player duration first, falling back to song duration", () => {
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayer({
          duration: undefined,
          currentSong: createSong({ duration: 300 }),
        }),
      );

      render(<MiniPlayer onExpand={mockOnExpand} />);

      expect(vi.mocked(PlaybackTimeDisplay)).toHaveBeenLastCalledWith(
        expect.objectContaining({ maxDuration: 300 }),
        undefined,
      );
    });

    it("wires player callbacks directly into playback components", () => {
      const state = createMockPlayer();
      vi.mocked(usePlayer).mockReturnValue(state);

      render(<MiniPlayer onExpand={mockOnExpand} />);

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
  });

  describe("Desktop Auxiliary Controls (RAC)", () => {
    it("toggles loop state and updates aria labels", async () => {
      const user = userEvent.setup();
      const toggleLoop = vi.fn();
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayer({ isLooping: true, toggleLoop }),
      );

      render(<MiniPlayer onExpand={mockOnExpand} />);

      const loopButton = screen.getByRole("button", { name: "Disable loop" });
      await user.click(loopButton);

      expect(toggleLoop).toHaveBeenCalledTimes(1);
    });

    it("opens and closes the Play History popover via RAC", async () => {
      const user = userEvent.setup();
      render(<MiniPlayer onExpand={mockOnExpand} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: "Toggle play history" }),
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByTestId("play-history")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Close history" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("disables metadata button and does nothing when no song is playing", async () => {
      const user = userEvent.setup();
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayer({ currentSong: null }),
      );

      render(<MiniPlayer onExpand={mockOnExpand} />);

      const metaButton = screen.getByRole("button", {
        name: "View song details",
      });
      expect(metaButton).toBeDisabled();

      await user.click(metaButton);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("handleMetaClick returns early if currentSong is null", () => {
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayer({ currentSong: null }),
      );
      render(<MiniPlayer onExpand={mockOnExpand} />);

      const metaButton = screen.getByRole("button", {
        name: "View song details",
      });
      fireEvent.click(metaButton);

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockOnExpand).not.toHaveBeenCalled();
    });

    it("handles duration being null or undefined by defaulting to 0", () => {
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayer({
          duration: undefined,
          currentSong: createSong({ duration: 0 }),
        }),
      );

      render(<MiniPlayer onExpand={mockOnExpand} />);

      expect(vi.mocked(PlaybackControls)).toHaveBeenLastCalledWith(
        expect.objectContaining({ disablePrev: true, disableNext: true }),
        undefined,
      );
    });

    it("passes undefined to WaveProgressBar when no song is present", () => {
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayer({ currentSong: null }),
      );

      render(<MiniPlayer onExpand={mockOnExpand} />);

      expect(vi.mocked(WaveProgressBar)).toHaveBeenLastCalledWith(
        expect.objectContaining({ currentSong: undefined }),
        undefined,
      );
    });

    it("updates SongMeta with new refs when song changes", () => {
      const { rerender } = render(<MiniPlayer onExpand={mockOnExpand} />);

      const newSong = createSong({ id: 99, title: "New Title" });
      vi.mocked(usePlayer).mockReturnValue(
        createMockPlayer({ currentSong: newSong }),
      );

      rerender(<MiniPlayer onExpand={mockOnExpand} />);

      expect(vi.mocked(SongMeta)).toHaveBeenCalled();
    });
  });
});
