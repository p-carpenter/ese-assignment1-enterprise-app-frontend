import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongHero } from "./SongHero";
import { usePlayer } from "@/features/player/components";
import type { Song } from "@/features/songs/types";
import type { PlayerContextType } from "@/shared/context/PlayerContext";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

const mockAuthState: { user: { id: number; username: string } | null } = {
  user: { id: 10, username: "owner" },
};

vi.mock("@/shared/context/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

vi.mock("@/features/player/components", () => ({
  usePlayer: vi.fn(),
}));

vi.mock("../SongEditForm/SongEditForm", () => ({
  SongEditForm: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="song-edit-form">
      <button onClick={onClose}>Close edit</button>
    </div>
  ),
}));

const baseSong: Song = {
  id: 1,
  title: "Test Song",
  artist: "Test Artist",
  album: "Test Album",
  release_year: 2024,
  duration: 125, // 2:05
  file_url: "https://example.com/song.mp3",
  uploaded_at: "2024-01-01T00:00:00Z",
  cover_art_url: "https://placehold.co/220",
  uploaded_by: { id: 99, username: "other" },
};

// Define explicit spies so we can assert against player actions
const mockPlay = vi.fn();
const mockPause = vi.fn();
const mockPlaySong = vi.fn();

const makePlayerState = (
  overrides: Partial<PlayerContextType> = {},
): PlayerContextType =>
  ({
    currentSong: null,
    playlist: [],
    isPlaying: false,
    isLoading: false,
    isLooping: false,
    duration: 0,
    volume: 1,
    play: mockPlay,
    pause: mockPause,
    seek: vi.fn(),
    getPosition: vi.fn(() => 0),
    setVolume: vi.fn(),
    setPlaylist: vi.fn(),
    playSong: mockPlaySong,
    playPrev: vi.fn(),
    playNext: vi.fn(),
    toggleLoop: vi.fn(),
    ...overrides,
  }) as PlayerContextType;

describe("SongHero", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.user = { id: 10, username: "owner" };
    vi.mocked(usePlayer).mockReturnValue(makePlayerState());
  });

  describe("Layout & Metadata", () => {
    it("renders fallback cover art when URL is empty", () => {
      const songNoCover: Song = { ...baseSong, cover_art_url: "" };
      render(<SongHero song={songNoCover} />);

      const img = screen.getByRole("img", { name: "Test Song" });
      expect(img).toHaveAttribute("src", "https://placehold.co/220");
    });

    it("renders album and release year with separator", () => {
      render(<SongHero song={baseSong} />);
      expect(screen.getByText("Test Album · 2024")).toBeInTheDocument();
    });

    it("renders only album if release year is missing (no separator)", () => {
      const songOnlyAlbum: Song = {
        ...baseSong,
        album: "Solo Album",
        release_year: undefined,
      };
      render(<SongHero song={songOnlyAlbum} />);
      expect(screen.getByText("Solo Album")).toBeInTheDocument();
      expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    });

    it("renders only release year if album is missing (no separator)", () => {
      const songOnlyYear: Song = {
        ...baseSong,
        album: undefined,
        release_year: 2024,
      };
      render(<SongHero song={songOnlyYear} />);
      expect(screen.getByText("2024")).toBeInTheDocument();
      expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    });

    it("renders no meta line when album and release year are both missing", () => {
      const songNoMeta: Song = {
        ...baseSong,
        album: undefined,
        release_year: undefined,
      };
      render(<SongHero song={songNoMeta} />);
      expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    });

    it("formats duration correctly (2:05)", () => {
      render(<SongHero song={baseSong} />);
      expect(screen.getByText("2:05")).toBeInTheDocument();
    });

    it("handles zero duration correctly (0:00)", () => {
      render(<SongHero song={{ ...baseSong, duration: 0 }} />);
      expect(screen.getByText("0:00")).toBeInTheDocument();
    });

    it("should have no accessibility violations", async () => {
      const { container } = render(
        <SongHero song={{ ...baseSong, duration: 0 }} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Playback Interaction", () => {
    it("shows 'Play' icon when this song is not playing", () => {
      render(<SongHero song={baseSong} />);
      const playBtn = screen.getByRole("button", { name: "Play song" });
      expect(playBtn).toHaveTextContent("Play");
    });

    it("shows 'Pause' icon when this specific song is playing", () => {
      vi.mocked(usePlayer).mockReturnValue(
        makePlayerState({
          currentSong: { ...baseSong, id: baseSong.id },
          isPlaying: true,
        }),
      );

      render(<SongHero song={baseSong} />);
      const pauseBtn = screen.getByRole("button", { name: "Pause song" });
      expect(pauseBtn).toHaveTextContent("Pause");
    });

    it("shows 'Play' if currentSong is this song but it's paused", () => {
      vi.mocked(usePlayer).mockReturnValue(
        makePlayerState({
          currentSong: { ...baseSong, id: baseSong.id },
          isPlaying: false,
        }),
      );

      render(<SongHero song={baseSong} />);
      expect(
        screen.getByRole("button", { name: "Play song" }),
      ).toBeInTheDocument();
    });

    it("calls playSong when a new song is clicked", () => {
      render(<SongHero song={baseSong} />);
      fireEvent.click(screen.getByRole("button", { name: "Play song" }));

      expect(mockPlaySong).toHaveBeenCalledWith(baseSong, [baseSong]);
      expect(mockPlay).not.toHaveBeenCalled();
      expect(mockPause).not.toHaveBeenCalled();
    });

    it("calls pause when the currently playing song is clicked", () => {
      vi.mocked(usePlayer).mockReturnValue(
        makePlayerState({
          currentSong: { ...baseSong, id: baseSong.id },
          isPlaying: true,
        }),
      );

      render(<SongHero song={baseSong} />);
      fireEvent.click(screen.getByRole("button", { name: "Pause song" }));

      expect(mockPause).toHaveBeenCalledOnce();
      expect(mockPlay).not.toHaveBeenCalled();
      expect(mockPlaySong).not.toHaveBeenCalled();
    });

    it("calls play when the currently paused song is clicked", () => {
      vi.mocked(usePlayer).mockReturnValue(
        makePlayerState({
          currentSong: { ...baseSong, id: baseSong.id },
          isPlaying: false,
        }),
      );

      render(<SongHero song={baseSong} />);
      fireEvent.click(screen.getByRole("button", { name: "Play song" }));

      expect(mockPlay).toHaveBeenCalledOnce();
      expect(mockPause).not.toHaveBeenCalled();
      expect(mockPlaySong).not.toHaveBeenCalled();
    });
  });

  describe("Permissions & Editing", () => {
    it("hides edit button for non-owners", () => {
      render(<SongHero song={baseSong} />);
      expect(
        screen.queryByRole("button", { name: "Edit song" }),
      ).not.toBeInTheDocument();
    });

    it("shows edit button for owners", () => {
      const ownedSong: Song = {
        ...baseSong,
        uploaded_by: { id: 10, username: "owner" },
      };
      render(<SongHero song={ownedSong} />);
      expect(
        screen.getByRole("button", { name: "Edit song" }),
      ).toBeInTheDocument();
    });

    it("hides edit button if user is not authenticated", () => {
      mockAuthState.user = null;
      const ownedSong: Song = {
        ...baseSong,
        uploaded_by: { id: 10, username: "owner" },
      };
      render(<SongHero song={ownedSong} />);
      expect(
        screen.queryByRole("button", { name: "Edit song" }),
      ).not.toBeInTheDocument();
    });

    it("toggles between hero info and SongEditForm", () => {
      const ownedSong: Song = {
        ...baseSong,
        uploaded_by: { id: 10, username: "owner" },
      };
      render(<SongHero song={ownedSong} />);

      fireEvent.click(screen.getByRole("button", { name: "Edit song" }));
      expect(screen.getByTestId("song-edit-form")).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "Test Song" }),
      ).not.toBeInTheDocument();

      fireEvent.click(screen.getByText("Close edit"));
      expect(screen.queryByTestId("song-edit-form")).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Test Song" }),
      ).toBeInTheDocument();
    });
  });
});
