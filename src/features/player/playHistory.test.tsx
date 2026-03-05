import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PlayHistory } from "./components/PlayHistory/PlayHistory";
import { getPlayHistory } from "./api";
import { usePlayer } from "@/shared/context/PlayerContext";
import type { Song } from "@/features/songs/types";

vi.mock("./api", () => ({
  getPlayHistory: vi.fn(),
}));

vi.mock("@/shared/context/PlayerContext", () => ({
  usePlayer: vi.fn(),
}));

const mockGetPlayHistory = vi.mocked(getPlayHistory) as unknown as ReturnType<
  typeof vi.fn
>;
const mockedUsePlayer = usePlayer as unknown as ReturnType<typeof vi.fn>;

const mockSong: Song = {
  id: 10,
  title: "History Song",
  artist: "History Artist",
  duration: 200,
  file_url: "http://example.com/history.mp3",
  cover_art_url: "http://example.com/history.jpg",
  album: "History Album",
  release_year: "2026",
};

const mockEntry = {
  id: 1,
  song: mockSong,
  played_at: "2026-02-19T10:30:00.000Z",
};

describe("PlayHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUsePlayer.mockReturnValue({ historyTick: 0 });
    mockGetPlayHistory.mockResolvedValue({ count: 0, results: [] });
  });

  it("shows empty state when no history", async () => {
    mockGetPlayHistory.mockResolvedValueOnce({ count: 0, results: [] });

    render(<PlayHistory />);

    expect(await screen.findByText(/No play history yet/i)).toBeInTheDocument();
  });

  it("renders history entries from the API", async () => {
    mockGetPlayHistory.mockResolvedValueOnce({
      count: 1,
      results: [mockEntry],
    });

    render(<PlayHistory />);

    expect(await screen.findByText("History Song")).toBeInTheDocument();
    expect(screen.getByText("History Artist")).toBeInTheDocument();
  });

  it("re-fetches history when historyTick increments", async () => {
    mockGetPlayHistory.mockResolvedValue({ count: 0, results: [] });

    // First render with historyTick=0
    mockedUsePlayer.mockReturnValue({ historyTick: 0 });
    const { rerender } = render(<PlayHistory />);
    await screen.findByText(/no play history yet/i);

    // Simulate a new song being played (historyTick increments)
    mockGetPlayHistory.mockResolvedValueOnce({
      count: 1,
      results: [mockEntry],
    });
    mockedUsePlayer.mockReturnValue({ historyTick: 1 });
    rerender(<PlayHistory />);

    expect(await screen.findByText("History Song")).toBeInTheDocument();
    expect(mockGetPlayHistory).toHaveBeenCalledTimes(2);
  });

  it("renders the 'Recently Played' heading", async () => {
    mockGetPlayHistory.mockResolvedValueOnce({ count: 0, results: [] });

    render(<PlayHistory />);

    expect(await screen.findByText("Recently Played")).toBeInTheDocument();
  });

  it("renders the played_at timestamp for each entry", async () => {
    const playedAt = "2026-02-19T10:30:00.000Z";
    mockGetPlayHistory.mockResolvedValueOnce({
      count: 1,
      results: [{ ...mockEntry, played_at: playedAt }],
    });

    render(<PlayHistory />);

    await screen.findByText("History Song");
    // The component formats the date via toLocaleString()
    expect(
      screen.getByText(new Date(playedAt).toLocaleString()),
    ).toBeInTheDocument();
  });

  it("handles API errors gracefully (empty state shown)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockGetPlayHistory.mockRejectedValue(new Error("Server error"));

    render(<PlayHistory />);

    // The component catches the error and leaves the list empty
    expect(await screen.findByText(/no play history yet/i)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  // ─── Pagination ─────────────────────────────────────────────────────────────

  describe("pagination", () => {
    const PAGE_SIZE = 5;

    const makePage = (page: number, total: number) => {
      const results = Array.from({ length: PAGE_SIZE }, (_, i) => ({
        id: (page - 1) * PAGE_SIZE + i + 1,
        song: {
          ...mockSong,
          id: (page - 1) * PAGE_SIZE + i + 1,
          title: `Track ${(page - 1) * PAGE_SIZE + i + 1}`,
        },
        played_at: "2026-02-19T10:30:00.000Z",
      }));
      return { count: total, results };
    };

    it("does not render pagination controls when there is only one page", async () => {
      const singleEntry = {
        id: 1,
        song: { ...mockSong, title: "Solo Track" },
        played_at: "2026-02-19T10:30:00.000Z",
      };
      mockGetPlayHistory.mockResolvedValueOnce({
        count: 1,
        results: [singleEntry],
      });

      render(<PlayHistory />);
      await screen.findByText("Solo Track");

      expect(
        screen.queryByRole("button", { name: /prev/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /next/i }),
      ).not.toBeInTheDocument();
    });

    it("renders Prev/Next buttons when there are multiple pages", async () => {
      mockGetPlayHistory.mockResolvedValueOnce(makePage(1, 10));

      render(<PlayHistory />);
      await screen.findByText("Track 1");

      expect(screen.getByRole("button", { name: /prev/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    });

    it("Prev button is disabled on the first page", async () => {
      mockGetPlayHistory.mockResolvedValueOnce(makePage(1, 10));

      render(<PlayHistory />);
      await screen.findByText("Track 1");

      expect(screen.getByRole("button", { name: /prev/i })).toBeDisabled();
    });

    it("navigates to the next page when Next is clicked", async () => {
      mockGetPlayHistory
        .mockResolvedValueOnce(makePage(1, 10))
        .mockResolvedValueOnce(makePage(2, 10));

      render(<PlayHistory />);
      await screen.findByText("Track 1");

      fireEvent.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(mockGetPlayHistory).toHaveBeenCalledWith(2, PAGE_SIZE);
      });
      expect(await screen.findByText("Track 6")).toBeInTheDocument();
    });

    it("Next button is disabled on the last page", async () => {
      mockGetPlayHistory
        .mockResolvedValueOnce(makePage(1, 10))
        .mockResolvedValueOnce(makePage(2, 10));

      render(<PlayHistory />);
      await screen.findByText("Track 1");
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
      await screen.findByText("Track 6");

      expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    });

    it("navigates back to the previous page when Prev is clicked", async () => {
      mockGetPlayHistory
        .mockResolvedValueOnce(makePage(1, 10))
        .mockResolvedValueOnce(makePage(2, 10))
        .mockResolvedValueOnce(makePage(1, 10));

      render(<PlayHistory />);
      await screen.findByText("Track 1");
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
      await screen.findByText("Track 6");
      fireEvent.click(screen.getByRole("button", { name: /prev/i }));

      await waitFor(() => {
        expect(mockGetPlayHistory).toHaveBeenCalledWith(1, PAGE_SIZE);
      });
      expect(await screen.findByText("Track 1")).toBeInTheDocument();
    });

    it("displays the current page and total pages", async () => {
      mockGetPlayHistory.mockResolvedValueOnce(makePage(1, 10));

      render(<PlayHistory />);
      await screen.findByText("Track 1");

      expect(screen.getByText(/1\s*\/\s*2/)).toBeInTheDocument();
    });
  });
});
