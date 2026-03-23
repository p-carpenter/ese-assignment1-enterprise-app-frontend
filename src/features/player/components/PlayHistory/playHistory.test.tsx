import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { PlayHistory } from "./PlayHistory";
import { renderWithQueryClient } from "@/test/render";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { resetHandlerState } from "@/mocks/handlers";
import { createSong } from "@/test/factories/song";

const mockSong = createSong({
  title: "History Song",
  artist: "History Artist",
});

const mockEntry = {
  id: 1,
  song: mockSong,
  played_at: "2026-02-19T10:30:00.000Z",
};

describe("PlayHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHandlerState();
  });

  it("shows empty state when no history", async () => {
    server.use(
      http.get("http://localhost:8000/api/history/", () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
    );
    renderWithQueryClient(<PlayHistory />);
    expect(await screen.findByText(/No play history yet/i)).toBeInTheDocument();
  });

  it("renders history entries from the API", async () => {
    server.use(
      http.get("http://localhost:8000/api/history/", () =>
        HttpResponse.json({ count: 1, results: [mockEntry] }),
      ),
    );
    renderWithQueryClient(<PlayHistory />);

    expect(await screen.findByText("History Song")).toBeInTheDocument();
    expect(screen.getByText("History Artist")).toBeInTheDocument();
  });

  it("hides the title when hideTitle=true", async () => {
    server.use(
      http.get("http://localhost:8000/api/history/", () =>
        HttpResponse.json({ count: 0, results: [] }),
      ),
    );
    renderWithQueryClient(<PlayHistory hideTitle={true} />);

    await screen.findByText(/No play history yet/i);
    expect(screen.queryByText("Recently Played")).not.toBeInTheDocument();
  });

  it("handles API errors gracefully (empty state shown)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.get("http://localhost:8000/api/history/", () =>
        HttpResponse.error(),
      ),
    );

    renderWithQueryClient(<PlayHistory />);

    await waitFor(() => {
      expect(screen.queryByText("History Song")).not.toBeInTheDocument();
    });
    consoleSpy.mockRestore();
  });

  describe("pagination", () => {
    const makePage = (page: number) => {
      const results = Array.from({ length: 5 }, (_, i) => ({
        id: (page - 1) * 5 + i + 1,
        song: createSong({ title: `Track ${(page - 1) * 5 + i + 1}` }),
        played_at: "2026-02-19T10:30:00.000Z",
      }));
      return { count: 10, results };
    };

    it("does not render pagination controls when there is only one page", async () => {
      server.use(
        http.get("http://localhost:8000/api/history/", () =>
          HttpResponse.json({ count: 1, results: [mockEntry] }),
        ),
      );
      renderWithQueryClient(<PlayHistory />);

      await screen.findByText("History Song");
      expect(
        screen.queryByRole("button", { name: /prev/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /next/i }),
      ).not.toBeInTheDocument();
    });

    it("navigates to the next page when Next is clicked", async () => {
      let requestCount = 0;
      server.use(
        http.get("http://localhost:8000/api/history/", () => {
          requestCount++;
          return HttpResponse.json(makePage(requestCount));
        }),
      );

      renderWithQueryClient(<PlayHistory />);
      await screen.findByText("Track 1");

      fireEvent.click(screen.getByRole("button", { name: /next/i }));
      expect(await screen.findByText("Track 6")).toBeInTheDocument();
    });
  });
});
