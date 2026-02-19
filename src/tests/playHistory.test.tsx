import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import PlayHistory from "../components/features/player/PlayHistory";
import { api } from "../services/api";
import type { Song } from "../types";

vi.mock("../services/api", () => ({
  api: {
    playHistory: vi.fn(),
  },
}));

const mockedApi = api as unknown as {
  playHistory: ReturnType<typeof vi.fn>;
};

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
  });

  it("shows empty state when no history", async () => {
    mockedApi.playHistory.mockResolvedValueOnce([]);

    render(<PlayHistory keyTrigger={1} />);

    expect(await screen.findByText(/No play history yet/i)).toBeInTheDocument();
  });

  it("renders history entries from the API", async () => {
    mockedApi.playHistory.mockResolvedValueOnce([
      { song: mockSong, played_at: "2026-02-19T10:30:00.000Z" },
    ]);

    render(<PlayHistory keyTrigger={2} />);

    expect(await screen.findByText("History Song")).toBeInTheDocument();
    expect(screen.getByText("History Artist")).toBeInTheDocument();
  });
});
