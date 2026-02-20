import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MusicPlayer } from "@/features/player";
import { listSongs, logPlay } from "@/features/songs/api";
import type { Song } from "@/features/songs/types";

vi.mock("@/features/songs/api", () => ({
  listSongs: vi.fn(),
  logPlay: vi.fn(),
}));

const mockListSongs = vi.mocked(listSongs) as unknown as ReturnType<
  typeof vi.fn
>;
const mockLogPlay = vi.mocked(logPlay) as unknown as ReturnType<typeof vi.fn>;

const audioPlayerMocks = {
  play: vi.fn(),
  pause: vi.fn(),
  stop: vi.fn(),
  load: vi.fn(),
  getPosition: vi.fn().mockReturnValue(0),
  seek: vi.fn(),
};

vi.mock("react-use-audio-player", () => ({
  useAudioPlayer: () => ({
    ...audioPlayerMocks,
    isPlaying: false,
    duration: 180,
  }),
}));

const mockSongs: Song[] = [
  {
    id: 1,
    title: "Song A",
    artist: "Artist 1",
    duration: 120,
    file_url: "http://example.com/song1.mp3",
    cover_art_url: "http://example.com/cover1.jpg",
  },
  {
    id: 2,
    title: "Song B",
    artist: "Artist 2",
    duration: 150,
    file_url: "http://example.com/song2.mp3",
    cover_art_url: "http://example.com/cover2.jpg",
  },
];

describe("MusicPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListSongs.mockResolvedValue(mockSongs);
    mockLogPlay.mockResolvedValue(undefined);
  });

  it("loads and renders the song library", async () => {
    render(<MusicPlayer />);

    expect(await screen.findByText("Song A")).toBeInTheDocument();
    expect(screen.getByText("Song B")).toBeInTheDocument();
    expect(screen.getByText(/Library \(2 tracks\)/i)).toBeInTheDocument();
  });

  it("plays a song when selected and logs play", async () => {
    render(<MusicPlayer />);

    const songTitle = await screen.findByText("Song A");
    fireEvent.click(songTitle);

    await waitFor(() => {
      expect(audioPlayerMocks.stop).toHaveBeenCalled();
      expect(audioPlayerMocks.load).toHaveBeenCalledWith(
        "http://example.com/song1.mp3",
        expect.objectContaining({ autoplay: true }),
      );
      expect(mockLogPlay).toHaveBeenCalledWith(1);
    });
  });

  it("calls play when clicking the play button", async () => {
    render(<MusicPlayer />);

    fireEvent.click(await screen.findByText("Song A"));

    const playButton = await screen.findByRole("button", { name: "Play" });
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(audioPlayerMocks.play).toHaveBeenCalled();
    });
  });

  it("calls next when clicking the next button", async () => {
    render(<MusicPlayer />);

    fireEvent.click(await screen.findByText("Song A"));

    const nextButton = await screen.findByRole("button", { name: "Next" });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(audioPlayerMocks.stop).toHaveBeenCalled();
      expect(audioPlayerMocks.load).toHaveBeenCalledWith(
        "http://example.com/song2.mp3",
        expect.objectContaining({ autoplay: true }),
      );
    });
  });

  it("calls previous when clicking the previous button", async () => {
    render(<MusicPlayer />);

    fireEvent.click(await screen.findByText("Song B"));

    const previousButton = await screen.findByRole("button", {
      name: "Previous",
    });
    fireEvent.click(previousButton);

    await waitFor(() => {
      expect(audioPlayerMocks.stop).toHaveBeenCalled();
      expect(audioPlayerMocks.load).toHaveBeenCalledWith(
        "http://example.com/song1.mp3",
        expect.objectContaining({ autoplay: true }),
      );
    });
  });
});
