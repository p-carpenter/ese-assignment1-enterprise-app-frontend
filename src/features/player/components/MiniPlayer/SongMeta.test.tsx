import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongMeta } from "./SongMeta";
import { usePlayer } from "../..";
import styles from "./SongMeta.module.css";
import type { PlayerContextType } from "@/shared/context/PlayerContext";

vi.mock("../..", () => ({
  usePlayer: vi.fn(),
}));

const defaultPlayerContext: PlayerContextType = {
  currentSong: null,
  playlist: [],
  isPlaying: false,
  isLoading: false,
  isLooping: false,
  duration: 0,
  volume: 0.5,
  play: vi.fn(),
  pause: vi.fn(),
  playPrev: vi.fn(async () => {}),
  playNext: vi.fn(async () => {}),
  seek: vi.fn(),
  getPosition: vi.fn(() => 0),
  setVolume: vi.fn(),
  toggleLoop: vi.fn(),
  setPlaylist: vi.fn(),
  playSong: vi.fn(async () => {}),
};

describe("SongMeta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePlayer).mockReturnValue(defaultPlayerContext);
  });

  it("renders fallback metadata when no song is selected", () => {
    render(
      <SongMeta
        titleRef={{ current: null }}
        artistRef={{ current: null }}
        isScrolling={false}
        isArtistScrolling={false}
      />,
    );

    expect(screen.getByRole("img", { name: "No track" })).toHaveAttribute(
      "src",
      "https://placehold.co/48",
    );
    expect(screen.getByText("No track selected")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders current song details and applies scrolling classes", () => {
    vi.mocked(usePlayer).mockReturnValue({
      ...defaultPlayerContext,
      currentSong: {
        id: 1,
        title: "Song A",
        artist: "Artist A",
        file_url: "https://example.com/a.mp3",
        cover_art_url: "https://example.com/cover.jpg",
        duration: 100,
        uploaded_at: "2024-01-01T00:00:00Z",
      },
    });

    render(
      <SongMeta
        titleRef={{ current: null }}
        artistRef={{ current: null }}
        isScrolling={true}
        isArtistScrolling={true}
      />,
    );

    expect(screen.getByRole("img", { name: "Song A" })).toHaveAttribute(
      "src",
      "https://example.com/cover.jpg",
    );

    const title = screen.getByText("Song A");
    const artist = screen.getByText("Artist A");

    expect(title.className).toContain(styles.scrolling);
    expect(artist.className).toContain(styles.scrolling);
  });

  it("renders fallback cover art and metadata when song object exists but has missing string fields", () => {
    vi.mocked(usePlayer).mockReturnValue({
      ...defaultPlayerContext,
      currentSong: {
        id: 2,
        title: "",
        artist: "",
        file_url: "https://example.com/b.mp3",
        cover_art_url: "",
        duration: 120,
        uploaded_at: "2024-01-01T00:00:00Z",
      },
    });

    render(
      <SongMeta
        titleRef={{ current: null }}
        artistRef={{ current: null }}
        isScrolling={false}
        isArtistScrolling={false}
      />,
    );

    expect(screen.getByRole("img", { name: "No track" })).toHaveAttribute(
      "src",
      "https://placehold.co/48",
    );
    expect(screen.getByText("No track selected")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("does not apply scrolling classes when scrolling props are false", () => {
    vi.mocked(usePlayer).mockReturnValue({
      ...defaultPlayerContext,
      currentSong: {
        id: 3,
        title: "Short Title",
        artist: "Short Artist",
        file_url: "https://example.com/c.mp3",
        cover_art_url: "https://example.com/cover.jpg",
        duration: 100,
        uploaded_at: "2024-01-01T00:00:00Z",
      },
    });

    render(
      <SongMeta
        titleRef={{ current: null }}
        artistRef={{ current: null }}
        isScrolling={false}
        isArtistScrolling={false}
      />,
    );

    const title = screen.getByText("Short Title");
    const artist = screen.getByText("Short Artist");

    expect(title.className).not.toContain(styles.scrolling);
    expect(artist.className).not.toContain(styles.scrolling);
  });
});
