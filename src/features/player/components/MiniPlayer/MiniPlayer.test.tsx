import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useNavigate } from "react-router-dom";
import { MiniPlayer } from "./MiniPlayer";
import { useIsOverflowing } from "../../hooks/useOverflow";
import type { ComponentProps } from "react";
import type { Song } from "@/features/songs/types";
import type { PlayerContextType } from "@/shared/context/PlayerContext";
import type { PlaybackControls as PlaybackControlsComponent } from "../PlaybackControls/PlaybackControls";
import type { WaveProgressBar as WaveProgressBarComponent } from "../WaveProgressBar/WaveProgressBar";
import type { PlayHistory as PlayHistoryComponent } from "../PlayHistory/PlayHistory";
import type { SongMeta as SongMetaComponent } from "./SongMeta";
import type { PlaybackTimeDisplay as PlaybackTimeDisplayComponent } from "../PlaybackTimeDisplay/PlaybackTimeDisplay";

type PlaybackControlsProps = ComponentProps<typeof PlaybackControlsComponent>;
type WaveProgressBarProps = ComponentProps<typeof WaveProgressBarComponent>;
type PlayHistoryProps = ComponentProps<typeof PlayHistoryComponent>;
type SongMetaProps = ComponentProps<typeof SongMetaComponent>;
type PlaybackTimeDisplayProps = ComponentProps<
  typeof PlaybackTimeDisplayComponent
>;
type MiniPlayerState = Pick<
  PlayerContextType,
  | "currentSong"
  | "isPlaying"
  | "isLoading"
  | "isLooping"
  | "duration"
  | "play"
  | "pause"
  | "playPrev"
  | "playNext"
  | "seek"
  | "getPosition"
  | "toggleLoop"
>;

const mockUsePlayer = vi.fn();
const mockPlaybackControls = vi.fn();
const mockWaveProgressBar = vi.fn();
const mockPlayHistory = vi.fn();
const mockSongMeta = vi.fn();
const mockPlaybackTimeDisplay = vi.fn();
const mockVolumeBar = vi.fn(() => <div data-testid="volume-bar" />);
const mockNavigate = vi.fn();

let capturedPlaybackControlsProps: PlaybackControlsProps | undefined;
let capturedWaveProgressBarProps: WaveProgressBarProps | undefined;
let capturedPlayHistoryProps: PlayHistoryProps | undefined;
let capturedSongMetaProps: SongMetaProps | undefined;
let capturedPlaybackTimeDisplayProps: PlaybackTimeDisplayProps | undefined;

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: vi.fn() };
});

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

const expectDefined = <T,>(value: T | undefined): T => {
  expect(value).toBeDefined();
  return value as T;
};

vi.mock("../..", () => ({
  usePlayer: () => mockUsePlayer(),
  PlaybackControls: (props: PlaybackControlsProps) => {
    capturedPlaybackControlsProps = props;
    mockPlaybackControls(props);
    return <div data-testid="playback-controls" />;
  },
  WaveProgressBar: (props: WaveProgressBarProps) => {
    capturedWaveProgressBarProps = props;
    mockWaveProgressBar(props);
    return <div data-testid="wave-progress" />;
  },
  PlayHistory: (props: PlayHistoryProps) => {
    capturedPlayHistoryProps = props;
    mockPlayHistory(props);
    return <div data-testid="play-history" />;
  },
}));

vi.mock("../VolumeBar/VolumeBar", () => ({
  VolumeBar: () => {
    mockVolumeBar();
    return <div data-testid="volume-bar" />;
  },
}));

vi.mock("./SongMeta", () => ({
  SongMeta: (props: SongMetaProps) => {
    capturedSongMetaProps = props;
    mockSongMeta(props);
    return <div data-testid="song-meta" />;
  },
}));

vi.mock("../PlaybackTimeDisplay/PlaybackTimeDisplay", () => ({
  PlaybackTimeDisplay: (props: PlaybackTimeDisplayProps) => {
    capturedPlaybackTimeDisplayProps = props;
    mockPlaybackTimeDisplay(props);
    return <div data-testid="playback-time" />;
  },
}));

vi.mock("../../hooks/useOverflow", () => ({
  useIsOverflowing: vi.fn(),
}));

const makePlayerState = (
  overrides: Partial<MiniPlayerState> = {},
): MiniPlayerState => ({
  currentSong: makeSong(),
  isPlaying: false,
  isLoading: false,
  isLooping: false,
  duration: 200,
  play: vi.fn(),
  pause: vi.fn(),
  playPrev: vi.fn(async () => {}),
  playNext: vi.fn(async () => {}),
  seek: vi.fn(),
  getPosition: vi.fn(() => 10),
  toggleLoop: vi.fn(),
  ...overrides,
});

describe("MiniPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedPlaybackControlsProps = undefined;
    capturedWaveProgressBarProps = undefined;
    capturedPlayHistoryProps = undefined;
    capturedSongMetaProps = undefined;
    capturedPlaybackTimeDisplayProps = undefined;
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useIsOverflowing)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    mockUsePlayer.mockReturnValue(makePlayerState());
  });

  it("renders core child sections", () => {
    render(<MiniPlayer />);

    expect(screen.getByTestId("song-meta")).toBeInTheDocument();
    expect(screen.getByTestId("playback-controls")).toBeInTheDocument();
    expect(screen.getByTestId("wave-progress")).toBeInTheDocument();
    expect(screen.getByTestId("playback-time")).toBeInTheDocument();
    expect(screen.getByTestId("volume-bar")).toBeInTheDocument();
    expect(screen.getByTestId("play-history")).toBeInTheDocument();
  });

  it("navigates to song details when current song exists", () => {
    render(<MiniPlayer />);
    fireEvent.click(screen.getByRole("button", { name: "Go to song details" }));
    expect(mockNavigate).toHaveBeenCalledWith("/songs/4");
  });

  it("disables metadata navigation when no current song", () => {
    mockUsePlayer.mockReturnValue(makePlayerState({ currentSong: null }));
    render(<MiniPlayer />);

    const metaButton = screen.getByRole("button", {
      name: "Go to song details",
    });
    expect(metaButton).toBeDisabled();

    fireEvent.click(metaButton);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("passes disable controls when loading or maxDuration is zero", () => {
    mockUsePlayer.mockReturnValue(
      makePlayerState({
        isLoading: true,
        duration: undefined,
        currentSong: makeSong({ duration: 0 }),
      }),
    );

    render(<MiniPlayer />);

    const playbackProps = expectDefined(capturedPlaybackControlsProps);
    expect(playbackProps.isLoading).toBe(true);
    expect(playbackProps.disablePrev).toBe(true);
    expect(playbackProps.disableNext).toBe(true);
  });

  it("calculates maxDuration correctly when player duration is missing", () => {
    mockUsePlayer.mockReturnValue(
      makePlayerState({
        duration: undefined,
        currentSong: makeSong({ id: 7, title: "Song", duration: 300 }),
      }),
    );

    render(<MiniPlayer />);

    const timeProps = expectDefined(capturedPlaybackTimeDisplayProps);
    expect(timeProps.maxDuration).toBe(300);
  });

  it("passes max duration, isPlaying to PlaybackTimeDisplay and overflow flags to SongMeta", () => {
    mockUsePlayer.mockReturnValue(
      makePlayerState({
        duration: 180,
        isPlaying: true,
        currentSong: makeSong({ id: 7, title: "Song", duration: 240 }),
      }),
    );

    render(<MiniPlayer />);

    const timeProps = expectDefined(capturedPlaybackTimeDisplayProps);
    expect(timeProps.maxDuration).toBe(240);
    expect(timeProps.isPlaying).toBe(true);

    const metaProps = expectDefined(capturedSongMetaProps);
    expect(metaProps.isScrolling).toBe(false);
    expect(metaProps.isArtistScrolling).toBe(true);

    const waveProps = expectDefined(capturedWaveProgressBarProps);
    expect(waveProps.currentSong?.id).toBe(7);
  });

  it("wires player callbacks into playback controls and waveform", () => {
    const play = vi.fn();
    const pause = vi.fn();
    const playPrev = vi.fn(async () => {});
    const playNext = vi.fn(async () => {});
    const seek = vi.fn();
    const getPosition = vi.fn(() => 10);

    mockUsePlayer.mockReturnValue(
      makePlayerState({ play, pause, playPrev, playNext, seek, getPosition }),
    );

    render(<MiniPlayer />);

    const playbackProps = expectDefined(capturedPlaybackControlsProps);
    const waveProps = expectDefined(capturedWaveProgressBarProps);

    playbackProps.onPlay();
    playbackProps.onPause();
    playbackProps.onPrev();
    playbackProps.onNext();
    waveProps.seek(42);
    waveProps.getPosition();

    expect(play).toHaveBeenCalledTimes(1);
    expect(pause).toHaveBeenCalledTimes(1);
    expect(playPrev).toHaveBeenCalledTimes(1);
    expect(playNext).toHaveBeenCalledTimes(1);
    expect(seek).toHaveBeenCalledWith(42);
    expect(getPosition).toHaveBeenCalledTimes(1);
  });

  it("toggles loop using the loop button and reflects aria label", () => {
    const toggleLoop = vi.fn();
    mockUsePlayer.mockReturnValue(
      makePlayerState({ isLooping: true, toggleLoop }),
    );

    render(<MiniPlayer />);

    const loopButton = screen.getByRole("button", { name: "Disable loop" });
    fireEvent.click(loopButton);

    expect(toggleLoop).toHaveBeenCalledTimes(1);
  });

  it("renders play history toggle controls", () => {
    render(<MiniPlayer />);

    expect(
      screen.getByRole("button", { name: "Toggle play history" }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Close history", { selector: "button" }),
    ).toBeInTheDocument();

    const historyProps = expectDefined(capturedPlayHistoryProps);
    expect(historyProps.hideTitle).toBe(true);
  });
});
