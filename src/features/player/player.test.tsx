import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MusicPlayer } from "@/features/player";
import { PlayerProvider } from "@/features/player";
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
  const renderWithProvider = () =>
    render(
      <PlayerProvider>
        <MusicPlayer />
      </PlayerProvider>,
    );

  beforeEach(() => {
    vi.clearAllMocks();
    mockListSongs.mockResolvedValue(mockSongs);
    mockLogPlay.mockResolvedValue(undefined);
  });

  it("loads and renders the song library", async () => {
    renderWithProvider();

    expect(await screen.findByText("Song A")).toBeInTheDocument();
    expect(screen.getByText("Song B")).toBeInTheDocument();
    expect(screen.getByText(/Library \(2 tracks\)/i)).toBeInTheDocument();
  });

  it("plays a song when selected and logs play", async () => {
    renderWithProvider();

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
    renderWithProvider();

    fireEvent.click(await screen.findByText("Song A"));

    const playButton = await screen.findByRole("button", { name: "Play" });
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(audioPlayerMocks.play).toHaveBeenCalled();
    });
  });

  it("calls next when clicking the next button", async () => {
    renderWithProvider();

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
    renderWithProvider();

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

  it("wraps around to the last song when pressing Previous on the first track", async () => {
    renderWithProvider();

    // Select the first song
    fireEvent.click(await screen.findByText("Song A"));

    const previousButton = await screen.findByRole("button", {
      name: "Previous",
    });
    fireEvent.click(previousButton);

    await waitFor(() => {
      expect(audioPlayerMocks.load).toHaveBeenCalledWith(
        "http://example.com/song2.mp3",
        expect.objectContaining({ autoplay: true }),
      );
    });
  });

  it("wraps around to the first song when pressing Next on the last track", async () => {
    renderWithProvider();

    // Select the last song
    fireEvent.click(await screen.findByText("Song B"));

    const nextButton = await screen.findByRole("button", { name: "Next" });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(audioPlayerMocks.load).toHaveBeenCalledWith(
        "http://example.com/song1.mp3",
        expect.objectContaining({ autoplay: true }),
      );
    });
  });

  it("shows empty-state message when no song is selected", async () => {
    renderWithProvider();
    // Songs load, but none is selected yet
    await screen.findByText("Song A"); // wait for load
    expect(
      screen.getByText(/select a track from the library below/i),
    ).toBeInTheDocument();
  });

  it("displays the current song title and artist after selecting a track", async () => {
    renderWithProvider();

    fireEvent.click(await screen.findByText("Song A"));

    await waitFor(() => {
      // The h3 title element shows the current song's title in the player area
      expect(
        screen.getByRole("heading", { name: "Song A" }),
      ).toBeInTheDocument();
    });
  });

  it("shows the correct library count", async () => {
    renderWithProvider();
    expect(
      await screen.findByText(/library \(2 tracks\)/i),
    ).toBeInTheDocument();
  });

  it("handles listSongs API failure gracefully (empty library)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockListSongs.mockRejectedValueOnce(new Error("Network error"));

    renderWithProvider();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    expect(screen.queryByText("Song A")).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
