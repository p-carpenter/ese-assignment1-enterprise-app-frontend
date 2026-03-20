import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { JamendoSongSearch } from "./JamendoSongSearch";
import { searchJamendoTracks } from "../../api/jamendo";
import { uploadSong } from "../../api";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

vi.mock("../../api/jamendo", () => ({
  searchJamendoTracks: vi.fn(),
}));

vi.mock("../../api", () => ({
  uploadSong: vi.fn(),
}));

const mockedSearchJamendoTracks = vi.mocked(searchJamendoTracks);
const mockedUploadSong = vi.mocked(uploadSong);

describe("JamendoSongSearch", () => {
  const mockOnImportSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Search", () => {
    it("shows validation error when searching with empty query", async () => {
      const user = userEvent.setup();
      render(<JamendoSongSearch onImportSuccess={mockOnImportSuccess} />);

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

      render(<JamendoSongSearch onImportSuccess={mockOnImportSuccess} />);

      await user.type(screen.getByLabelText(/search jamendo tracks/i), "test");
      await user.click(screen.getByRole("button", { name: /search/i }));

      expect(await screen.findByText("Test Track")).toBeInTheDocument();
      expect(screen.getByText(/Artist A/i)).toBeInTheDocument();
      expect(mockedSearchJamendoTracks).toHaveBeenCalledWith("test");
    });

    it("shows empty state when search returns no results", async () => {
      const user = userEvent.setup();
      mockedSearchJamendoTracks.mockResolvedValueOnce([]);

      render(<JamendoSongSearch onImportSuccess={mockOnImportSuccess} />);

      await user.type(
        screen.getByLabelText(/search jamendo tracks/i),
        "notfound",
      );
      await user.click(screen.getByRole("button", { name: /search/i }));

      expect(
        await screen.findByText(/no tracks found for this search/i),
      ).toBeInTheDocument();
    });

    it("shows API error when Jamendo search fails", async () => {
      const user = userEvent.setup();
      mockedSearchJamendoTracks.mockRejectedValueOnce(
        new Error("Jamendo unavailable"),
      );

      render(<JamendoSongSearch onImportSuccess={mockOnImportSuccess} />);

      await user.type(screen.getByLabelText(/search jamendo tracks/i), "rock");
      await user.click(screen.getByRole("button", { name: /search/i }));

      expect(
        await screen.findByText("Jamendo unavailable"),
      ).toBeInTheDocument();
    });
  });

  describe("Import", () => {
    it("imports a track and calls onImportSuccess with mapped payload", async () => {
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
      mockedUploadSong.mockResolvedValueOnce({} as never);

      render(<JamendoSongSearch onImportSuccess={mockOnImportSuccess} />);

      await user.type(
        screen.getByLabelText(/search jamendo tracks/i),
        "mapped",
      );
      await user.click(screen.getByRole("button", { name: /search/i }));

      await screen.findByText("Mapped Song");

      await user.click(screen.getByRole("button", { name: /^import$/i }));

      await waitFor(() => {
        expect(mockedUploadSong).toHaveBeenCalledWith({
          title: "Mapped Song",
          artist: "Mapped Artist",
          album: "Mapped Album",
          release_year: 2020,
          file_url: "https://jamendo/audio-download.mp3",
          cover_art_url: "https://jamendo/image.jpg",
          duration: 178,
        });
      });

      expect(mockOnImportSuccess).toHaveBeenCalledTimes(1);
    });

    it("uses audio URL when audiodownload is missing", async () => {
      const user = userEvent.setup();
      mockedSearchJamendoTracks.mockResolvedValueOnce([
        {
          id: "j-3",
          name: "Stream Only",
          artist_name: "Stream Artist",
          duration: 101,
          audio: "https://jamendo/audio-only.mp3",
        },
      ]);
      mockedUploadSong.mockResolvedValueOnce({} as never);

      render(<JamendoSongSearch onImportSuccess={mockOnImportSuccess} />);

      await user.type(
        screen.getByLabelText(/search jamendo tracks/i),
        "stream",
      );
      await user.click(screen.getByRole("button", { name: /search/i }));

      await screen.findByText("Stream Only");
      await user.click(screen.getByRole("button", { name: /^import$/i }));

      await waitFor(() => {
        expect(mockedUploadSong).toHaveBeenCalledWith(
          expect.objectContaining({
            file_url: "https://jamendo/audio-only.mp3",
          }),
        );
      });
    });

    it("uses fallback defaults for missing optional Jamendo fields", async () => {
      const user = userEvent.setup();
      mockedSearchJamendoTracks.mockResolvedValueOnce([
        {
          id: "j-4",
          name: "Defaults Track",
          artist_name: "",
          duration: 0,
          audio: "https://jamendo/defaults.mp3",
        },
      ]);
      mockedUploadSong.mockResolvedValueOnce({} as never);

      render(<JamendoSongSearch onImportSuccess={mockOnImportSuccess} />);

      await user.type(
        screen.getByLabelText(/search jamendo tracks/i),
        "defaults",
      );
      await user.click(screen.getByRole("button", { name: /search/i }));

      await screen.findByText("Defaults Track");
      await user.click(screen.getByRole("button", { name: /^import$/i }));

      await waitFor(() => {
        expect(mockedUploadSong).toHaveBeenCalledWith({
          title: "Defaults Track",
          artist: "Unknown Artist",
          album: "Unknown Album",
          release_year: undefined,
          file_url: "https://jamendo/defaults.mp3",
          cover_art_url: "",
          duration: 0,
        });
      });
    });

    it("shows error and blocks import when no playable URL exists", async () => {
      const user = userEvent.setup();
      mockedSearchJamendoTracks.mockResolvedValueOnce([
        {
          id: "j-5",
          name: "Broken URL",
          artist_name: "Artist",
          duration: 120,
          audio: "",
        },
      ]);

      render(<JamendoSongSearch onImportSuccess={mockOnImportSuccess} />);

      await user.type(
        screen.getByLabelText(/search jamendo tracks/i),
        "broken",
      );
      await user.click(screen.getByRole("button", { name: /search/i }));

      await screen.findByText("Broken URL");
      await user.click(screen.getByRole("button", { name: /^import$/i }));

      expect(
        await screen.findByText(/no playable URL available for import/i),
      ).toBeInTheDocument();
      expect(mockedUploadSong).not.toHaveBeenCalled();
    });

    it("shows error when import fails and does not call success callback", async () => {
      const user = userEvent.setup();
      mockedSearchJamendoTracks.mockResolvedValueOnce([
        {
          id: "j-6",
          name: "Failing Import",
          artist_name: "Artist",
          duration: 95,
          audio: "https://jamendo/fail.mp3",
        },
      ]);
      mockedUploadSong.mockRejectedValueOnce(new Error("DB unavailable"));

      render(<JamendoSongSearch onImportSuccess={mockOnImportSuccess} />);

      await user.type(
        screen.getByLabelText(/search jamendo tracks/i),
        "failing",
      );
      await user.click(screen.getByRole("button", { name: /search/i }));

      await screen.findByText("Failing Import");
      await user.click(screen.getByRole("button", { name: /^import$/i }));

      expect(await screen.findByText("DB unavailable")).toBeInTheDocument();
      expect(mockOnImportSuccess).not.toHaveBeenCalled();
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

      let rejectImport!: (reason?: unknown) => void;
      mockedUploadSong.mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectImport = reject;
          }) as never,
      );

      render(<JamendoSongSearch onImportSuccess={mockOnImportSuccess} />);

      await user.type(
        screen.getByLabelText(/search jamendo tracks/i),
        "pending",
      );
      await user.click(screen.getByRole("button", { name: /search/i }));

      await screen.findByText("Pending Failure Song");

      const importButton = screen.getByRole("button", { name: /^import$/i });
      await user.click(importButton);

      expect(screen.getByRole("button", { name: /importing/i })).toBeDisabled();

      rejectImport(new Error("Import failed later"));

      expect(
        await screen.findByText("Import failed later"),
      ).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /^import$/i })).toBeEnabled();
      });
      expect(mockOnImportSuccess).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("renders search error AlertMessage when searchError is set", async () => {
      render(<JamendoSongSearch onImportSuccess={vi.fn()} />);
      // Simulate empty search to trigger searchError.
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: /search/i }));
      expect(
        await screen.findByText(/enter a title, artist, or keyword/i),
      ).toBeInTheDocument();
    });

    it("renders import error AlertMessage when importError is set", async () => {
      const user = userEvent.setup();
      // Mock a track with no playable URL.
      vi.mocked(searchJamendoTracks).mockResolvedValueOnce([
        {
          id: "j-8",
          name: "No URL",
          artist_name: "Artist",
          duration: 120,
          audio: "",
        },
      ]);
      render(<JamendoSongSearch onImportSuccess={vi.fn()} />);
      await user.type(
        screen.getByLabelText(/search jamendo tracks/i),
        "no-url",
      );
      await user.click(screen.getByRole("button", { name: /search/i }));
      await screen.findByText("No URL");
      await user.click(screen.getByRole("button", { name: /^import$/i }));
      expect(
        await screen.findByText(/no playable URL available for import/i),
      ).toBeInTheDocument();
    });

    it("does not render AlertMessage when there are no errors", () => {
      render(<JamendoSongSearch onImportSuccess={vi.fn()} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(
        <JamendoSongSearch onImportSuccess={vi.fn()} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
