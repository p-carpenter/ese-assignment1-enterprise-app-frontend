import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { JamendoSongSearch } from "./JamendoSongSearch";
import { searchJamendoTracks } from "../../api/jamendo";
import * as songsApi from "../../api";
import { renderWithQueryClient } from "@/test/render";
import { server } from "@/mocks/server";
import { http, HttpResponse, delay } from "msw";
import { resetHandlerState } from "@/mocks/handlers";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

vi.mock("../../api/jamendo", () => ({
  searchJamendoTracks: vi.fn(),
}));

const mockedSearchJamendoTracks = vi.mocked(searchJamendoTracks);

describe("JamendoSongSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHandlerState();
  });

  describe("Search", () => {
    it("shows validation error when searching with empty query", async () => {
      const user = userEvent.setup();
      renderWithQueryClient(<JamendoSongSearch />);

      await user.click(screen.getByRole("button", { name: /search/i }));

      expect(
        await screen.findByText(/enter a title, artist, or keyword/i),
      ).toBeInTheDocument();
      expect(mockedSearchJamendoTracks).not.toHaveBeenCalled();
    });

    it("renders search results from Jamendo", async () => {
      const user = userEvent.setup();
      mockedSearchJamendoTracks.mockResolvedValueOnce([
        {
          id: "j-1",
          name: "Test Track",
          artist_name: "Artist A",
          duration: 125,
          audio: "https://jamendo/audio.mp3",
        },
      ]);

      renderWithQueryClient(<JamendoSongSearch />);

      await user.type(screen.getByLabelText(/search jamendo tracks/i), "test");
      await user.click(screen.getByRole("button", { name: /search/i }));

      expect(await screen.findByText("Test Track")).toBeInTheDocument();
    });

    it("handles non-Error objects returned by the search API cleanly", async () => {
      const user = userEvent.setup();
      mockedSearchJamendoTracks.mockRejectedValueOnce(
        "Just a generic string failure",
      );

      renderWithQueryClient(<JamendoSongSearch />);

      await user.type(screen.getByLabelText(/search jamendo tracks/i), "error");
      await user.click(screen.getByRole("button", { name: /search/i }));

      expect(
        await screen.findByText("Failed to search Jamendo."),
      ).toBeInTheDocument();
    });
  });

  describe("Import", () => {
    it("imports a track and updates the button to 'Added'", async () => {
      const user = userEvent.setup();
      mockedSearchJamendoTracks.mockResolvedValueOnce([
        {
          id: "j-2",
          name: "Mapped Song",
          artist_name: "Mapped Artist",
          album_name: "Mapped Album",
          releasedate: "2020-09-01",
          duration: 178,
          audio: "https://jamendo/audio-stream.mp3",
          audiodownload: "https://jamendo/audio-download.mp3",
          image: "https://jamendo/image.jpg",
        },
      ]);

      server.use(
        http.post("http://localhost:8000/api/songs/", () => {
          return HttpResponse.json({ id: 99, title: "Mapped Song" }, { status: 201 });
        }),
      );

      renderWithQueryClient(<JamendoSongSearch />);

      await user.type(
        screen.getByLabelText(/search jamendo tracks/i),
        "mapped",
      );
      await user.click(screen.getByRole("button", { name: /search/i }));
      await screen.findByText("Mapped Song");

      await user.click(screen.getByRole("button", { name: /^import$/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^added$/i })).toBeInTheDocument();
      });
    });

    it("shows error when track has no playable URL available", async () => {
      const user = userEvent.setup();
      mockedSearchJamendoTracks.mockResolvedValueOnce([
        {
          id: "j-nourl",
          name: "No URL",
          artist_name: "Artist",
          duration: 100,
          audio: "",
          audiodownload: "",
        },
      ]);

      renderWithQueryClient(<JamendoSongSearch />);
      
      await user.type(screen.getByLabelText(/search jamendo tracks/i), "nourl");
      await user.click(screen.getByRole("button", { name: /search/i }));

      await screen.findByText("No URL");
      await user.click(screen.getByRole("button", { name: /^import$/i }));

      expect(
        await screen.findByText(
          "This track has no playable URL available for import.",
        ),
      ).toBeInTheDocument();
    });

    it("handles standard ApiErrors natively through HTTP interceptors (MSW)", async () => {
      const user = userEvent.setup();
      mockedSearchJamendoTracks.mockResolvedValueOnce([
        {
          id: "j-6",
          name: "API Error Track",
          artist_name: "Artist",
          duration: 95,
          audio: "https://jamendo/api.mp3",
        },
      ]);

      server.use(
        http.post("http://localhost:8000/api/songs/", () => {
          return HttpResponse.json(
            { detail: "Simulated ApiError Response" },
            { status: 400 },
          );
        }),
      );

      renderWithQueryClient(<JamendoSongSearch />);

      await user.type(
        screen.getByLabelText(/search jamendo tracks/i),
        "apierr",
      );
      await user.click(screen.getByRole("button", { name: /search/i }));

      await screen.findByText("API Error Track");
      await user.click(screen.getByRole("button", { name: /^import$/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    it("handles non-Error values thrown from upload routine", async () => {
      const user = userEvent.setup();
      mockedSearchJamendoTracks.mockResolvedValueOnce([
        {
          id: "j-nonerr",
          name: "Non Error Track",
          artist_name: "Artist",
          duration: 100,
          audio: "https://jamendo/nonerr.mp3",
        },
      ]);

      const spy = vi
        .spyOn(songsApi, "uploadSong")
        .mockRejectedValueOnce("String Exception");

      renderWithQueryClient(<JamendoSongSearch />);
      
      await user.type(
        screen.getByLabelText(/search jamendo tracks/i),
        "nonerr",
      );
      await user.click(screen.getByRole("button", { name: /search/i }));

      await screen.findByText("Non Error Track");
      await user.click(screen.getByRole("button", { name: /^import$/i }));

      expect(
        await screen.findByText("Failed to import Jamendo track."),
      ).toBeInTheDocument();
      spy.mockRestore();
    });

    it("disables import during request and re-enables after failed import", async () => {
      const user = userEvent.setup();
      mockedSearchJamendoTracks.mockResolvedValueOnce([
        {
          id: "j-7",
          name: "Pending Failure Song",
          artist_name: "Artist",
          duration: 120,
          audio: "https://jamendo/pending-failure.mp3",
        },
      ]);

      server.use(
        http.post("http://localhost:8000/api/songs/", async () => {
          await delay(200);
          return HttpResponse.error();
        }),
      );

      renderWithQueryClient(<JamendoSongSearch />);

      await user.type(
        screen.getByLabelText(/search jamendo tracks/i),
        "pending",
      );
      await user.click(screen.getByRole("button", { name: /search/i }));
      await screen.findByText("Pending Failure Song");

      const importButton = screen.getByRole("button", { name: /^import$/i });
      await user.click(importButton);

      expect(screen.getByRole("button", { name: /importing/i })).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^import$/i })).toBeEnabled();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have no accessibility violations", async () => {
      const { container } = renderWithQueryClient(<JamendoSongSearch />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});