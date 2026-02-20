import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlayHistory } from "./components/PlayHistory/PlayHistory";
import { getPlayHistory } from "./api";
import type { Song } from "@/features/songs/types";

vi.mock("./api", () => ({
  getPlayHistory: vi.fn(),
}));

const mockGetPlayHistory = vi.mocked(getPlayHistory) as unknown as ReturnType<
  typeof vi.fn
>;

const mockSong: Song = {
  id: 10,
  title: "History Song",
  artist: "History Artist",
  duration: 200,
  file_url: "http://example.com/history.mp3",
  cover_art_url: "http://example.com/history.jpg",
};

describe("PlayHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPlayHistory.mockResolvedValue([]);
  });

  it("shows empty state when no history", async () => {
    mockGetPlayHistory.mockResolvedValueOnce([]);

    render(<PlayHistory keyTrigger={1} />);

    expect(await screen.findByText(/No play history yet/i)).toBeInTheDocument();
  });

  it("renders history entries from the API", async () => {
    mockGetPlayHistory.mockResolvedValueOnce([
      { song: mockSong, played_at: "2026-02-19T10:30:00.000Z" },
    ]);

    render(<PlayHistory keyTrigger={2} />);

    expect(await screen.findByText("History Song")).toBeInTheDocument();
    expect(screen.getByText("History Artist")).toBeInTheDocument();
  });

  it("re-fetches history when keyTrigger changes", async () => {
    mockGetPlayHistory.mockResolvedValue([]);

    const { rerender } = render(<PlayHistory keyTrigger={0} />);
    await screen.findByText(/no play history yet/i);

    mockGetPlayHistory.mockResolvedValueOnce([
      { song: mockSong, played_at: "2026-02-19T10:30:00.000Z" },
    ]);
    rerender(<PlayHistory keyTrigger={1} />);

    expect(await screen.findByText("History Song")).toBeInTheDocument();
    expect(mockGetPlayHistory).toHaveBeenCalledTimes(2);
  });

  it("renders the 'Recently Played' heading", async () => {
    mockGetPlayHistory.mockResolvedValueOnce([]);

    render(<PlayHistory keyTrigger={0} />);

    expect(await screen.findByText("Recently Played")).toBeInTheDocument();
  });

  it("renders the played_at timestamp for each entry", async () => {
    const playedAt = "2026-02-19T10:30:00.000Z";
    mockGetPlayHistory.mockResolvedValueOnce([
      { song: mockSong, played_at: playedAt },
    ]);

    render(<PlayHistory keyTrigger={1} />);

    await screen.findByText("History Song");
    // The component formats the date via toLocaleString()
    expect(
      screen.getByText(new Date(playedAt).toLocaleString()),
    ).toBeInTheDocument();
  });

  it("handles API errors gracefully (empty state shown)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetPlayHistory.mockRejectedValueOnce(new Error("Server error"));

    render(<PlayHistory keyTrigger={1} />);

    // The component catches the error and leaves the list empty
    expect(await screen.findByText(/no play history yet/i)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});
