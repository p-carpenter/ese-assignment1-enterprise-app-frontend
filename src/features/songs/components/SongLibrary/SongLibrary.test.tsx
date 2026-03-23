import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongLibrary } from "./SongLibrary";
import { renderWithQueryClient } from "@/test/render";
import { MemoryRouter } from "react-router-dom";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { resetHandlerState } from "@/mocks/handlers";
import { createSong } from "@/test/factories/song";
import { interactionObserverMock } from "../../../../../vitest.setup.ts";
import { PlayerProvider } from "@/shared/context/PlayerContext.tsx";

describe("SongLibrary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHandlerState();
  });

  const renderComponent = () =>
    renderWithQueryClient(
      <MemoryRouter>
        <PlayerProvider>
          <SongLibrary />
        </PlayerProvider>
      </MemoryRouter>,
    );

  it("renders library and handles order switching", async () => {
    server.use(
      http.get("http://localhost:8000/api/songs/", ({ request }) => {
        const url = new URL(request.url);
        const ordering = url.searchParams.get("ordering");

        return HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [
            createSong({
              id: 1,
              title: `Ordered by ${ordering}`,
            }),
          ],
        });
      }),
    );

    renderComponent();

    expect(await screen.findByText("Ordered by title")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "-duration" },
    });

    expect(await screen.findByText("Ordered by -duration")).toBeInTheDocument();
  });

  it("logs errors when fetching fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    server.use(
      http.get("http://localhost:8000/api/songs/", () =>
        HttpResponse.json({ detail: "Server Error" }, { status: 500 }),
      ),
    );

    renderComponent();

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch songs:",
        expect.any(Error),
      );
    });

    consoleSpy.mockRestore();
  });

  it("fetches next page when sentinel intersects", async () => {
    server.use(
      http.get("http://localhost:8000/api/songs/", ({ request }) => {
        const url = new URL(request.url);
        const pageParam = Number(url.searchParams.get("page")) || 1;

        return HttpResponse.json({
          count: 2,
          next:
            pageParam === 1 ? "http://localhost:8000/api/songs/?page=2" : null,
          previous: null,
          results: [
            createSong({
              id: pageParam,
              title: `Song page ${pageParam}`,
            }),
          ],
        });
      }),
    );

    renderComponent();

    await screen.findByText("Song page 1");

    // Find the sentinel.
    const sentinel = screen.getByTestId("scroll-sentinel");

    interactionObserverMock.enterNode(sentinel);

    expect(await screen.findByText("Song page 2")).toBeInTheDocument();
  });
});
