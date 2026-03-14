import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Song } from "@/features/songs";
import { SongHero } from "./SongHero";

const mockAuthState = {
  user: {
    id: 10,
    username: "owner",
    email: "owner@example.com",
  },
  loading: false,
  setUser: vi.fn(),
  refreshUser: vi.fn(async () => {}),
  login: vi.fn(async () => {}),
  logout: vi.fn(async () => {}),
};

vi.mock("@/shared/context/AuthContext", () => ({
  useAuth: () => mockAuthState,
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
  release_year: "2024",
  file_url: "https://example.com/song.mp3",
  cover_art_url: undefined,
  duration: 125,
  uploaded_at: "2024-01-01T00:00:00Z",
  uploaded_by: { id: 99, username: "other" },
};

describe("SongHero", () => {
  const mockOnPlayClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.user = {
      id: 10,
      username: "owner",
      email: "owner@example.com",
    };
  });

  it("renders fallback cover art and formatted duration", () => {
    render(<SongHero song={baseSong} onPlayClick={mockOnPlayClick} />);

    const cover = screen.getByRole("img", { name: "Test Song" });
    expect(cover).toHaveAttribute("src", "https://placehold.co/400");
    expect(screen.getByText("2:05")).toBeInTheDocument();
  });

  it("renders album and release year metadata when available", () => {
    render(<SongHero song={baseSong} onPlayClick={mockOnPlayClick} />);

    expect(screen.getByText("Test Album · 2024")).toBeInTheDocument();
  });

  it("hides metadata when album and release year are missing", () => {
    const songWithoutMeta: Song = {
      ...baseSong,
      album: undefined,
      release_year: undefined,
    };

    render(<SongHero song={songWithoutMeta} onPlayClick={mockOnPlayClick} />);

    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });

  it("shows edit button only for the uploader", () => {
    render(<SongHero song={baseSong} onPlayClick={mockOnPlayClick} />);
    expect(
      screen.queryByRole("button", { name: "Edit song" }),
    ).not.toBeInTheDocument();
  });

  it("uses provided cover art and shows edit button for uploader", () => {
    const ownedSong: Song = {
      ...baseSong,
      uploaded_by: { id: 10, username: "owner" },
      cover_art_url: "https://example.com/cover.jpg",
    };

    render(<SongHero song={ownedSong} onPlayClick={mockOnPlayClick} />);

    expect(screen.getByRole("img", { name: "Test Song" })).toHaveAttribute(
      "src",
      "https://example.com/cover.jpg",
    );
    expect(
      screen.getByRole("button", { name: "Edit song" }),
    ).toBeInTheDocument();
  });

  it("toggles between hero details and edit form", () => {
    const ownedSong: Song = {
      ...baseSong,
      uploaded_by: { id: 10, username: "owner" },
    };

    render(<SongHero song={ownedSong} onPlayClick={mockOnPlayClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit song" }));
    expect(screen.getByTestId("song-edit-form")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Test Song" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close edit" }));
    expect(screen.queryByTestId("song-edit-form")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Test Song" }),
    ).toBeInTheDocument();
  });

  it("calls onPlayClick when play button is clicked", () => {
    render(<SongHero song={baseSong} onPlayClick={mockOnPlayClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Play song" }));
    expect(mockOnPlayClick).toHaveBeenCalledOnce();
  });
});
