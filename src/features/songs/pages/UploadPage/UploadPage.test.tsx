import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { UploadPage } from "./UploadPage";
import "@testing-library/jest-dom/vitest";
import { searchJamendoTracks } from "@/features/songs/api/jamendo";
import { uploadSong } from "@/features/songs/api";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/features/songs", () => ({
  SongUploadForm: () => (
    <div data-testid="song-upload-form">Song Upload Form</div>
  ),
}));

vi.mock("@/features/songs/api/jamendo", () => ({
  searchJamendoTracks: vi.fn(),
}));

vi.mock("@/features/songs/api", async () => {
  const actual = await vi.importActual<typeof import("@/features/songs/api")>(
    "@/features/songs/api",
  );
  return {
    ...actual,
    uploadSong: vi.fn(),
  };
});

const mockedSearchJamendoTracks = vi.mocked(searchJamendoTracks);
const mockedUploadSong = vi.mocked(uploadSong);

describe("UploadPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Tab Navigation", () => {
    it("shows upload tab content by default", () => {
      render(
        <MemoryRouter>
          <UploadPage />
        </MemoryRouter>,
      );
      expect(screen.getByTestId("song-upload-form")).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: /import from jamendo/i }),
      ).not.toBeInTheDocument();
    });

    it("switches to Jamendo tab content", async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <UploadPage />
        </MemoryRouter>,
      );

      await user.click(screen.getByRole("button", { name: /import jamendo/i }));

      expect(
        screen.getByRole("heading", { name: /import from jamendo/i }),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("song-upload-form")).not.toBeInTheDocument();
    });

    it("switches back to upload tab after opening Jamendo tab", async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <UploadPage />
        </MemoryRouter>,
      );

      await user.click(screen.getByRole("button", { name: /import jamendo/i }));
      expect(
        screen.getByRole("heading", { name: /import from jamendo/i }),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /upload file/i }));

      expect(screen.getByTestId("song-upload-form")).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: /import from jamendo/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Actions", () => {
    it("renders a 'Go Home' button", () => {
      render(
        <MemoryRouter>
          <UploadPage />
        </MemoryRouter>,
      );
      expect(
        screen.getByRole("button", { name: /go home/i }),
      ).toBeInTheDocument();
    });

    it("navigates to '/' when Go Home is clicked", async () => {
      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <UploadPage />
        </MemoryRouter>,
      );
      await user.click(screen.getByRole("button", { name: /go home/i }));
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("Integration", () => {
    it("imports a Jamendo track from the UploadPage Jamendo tab", async () => {
      const user = userEvent.setup();
      mockedSearchJamendoTracks.mockResolvedValueOnce([
        {
          id: "j-int-1",
          name: "Integration Song",
          artist_name: "Integration Artist",
          album_name: "Integration Album",
          releasedate: "2019-03-12",
          duration: 212,
          audio: "https://jamendo/stream.mp3",
          audiodownload: "https://jamendo/download.mp3",
          image: "https://jamendo/cover.jpg",
        },
      ]);
      mockedUploadSong.mockResolvedValueOnce({} as never);

      render(
        <MemoryRouter>
          <UploadPage />
        </MemoryRouter>,
      );

      await user.click(screen.getByRole("button", { name: /import jamendo/i }));

      await user.type(
        screen.getByLabelText(/search jamendo tracks/i),
        "integration",
      );
      await user.click(screen.getByRole("button", { name: /search/i }));

      expect(await screen.findByText("Integration Song")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /^import$/i }));

      await waitFor(() => {
        expect(mockedUploadSong).toHaveBeenCalledWith({
          title: "Integration Song",
          artist: "Integration Artist",
          album: "Integration Album",
          release_year: 2019,
          file_url: "https://jamendo/download.mp3",
          cover_art_url: "https://jamendo/cover.jpg",
          duration: 212,
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("shows import error and does not navigate when Jamendo import fails", async () => {
      const user = userEvent.setup();
      mockedSearchJamendoTracks.mockResolvedValueOnce([
        {
          id: "j-int-2",
          name: "Broken Integration Song",
          artist_name: "Integration Artist",
          duration: 180,
          audio: "https://jamendo/broken.mp3",
        },
      ]);
      mockedUploadSong.mockRejectedValueOnce(new Error("DB unavailable"));

      render(
        <MemoryRouter>
          <UploadPage />
        </MemoryRouter>,
      );

      await user.click(screen.getByRole("button", { name: /import jamendo/i }));

      await user.type(
        screen.getByLabelText(/search jamendo tracks/i),
        "broken",
      );
      await user.click(screen.getByRole("button", { name: /search/i }));

      expect(
        await screen.findByText("Broken Integration Song"),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /^import$/i }));

      expect(await screen.findByText("DB unavailable")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^import$/i })).toBeEnabled();
      expect(mockNavigate).not.toHaveBeenCalledWith("/");
    });
  });
});
