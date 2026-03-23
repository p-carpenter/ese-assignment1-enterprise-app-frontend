import { screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SongUploadForm } from "./SongUploadForm";
import { useCloudinaryUpload } from "@/shared/hooks";
import { readId3Tags } from "@/shared/hooks/useId3Tags";
import { queryKeys } from "@/shared/lib/queryKeys";
import { SongDetailsForm } from "../SongDetailsForm/SongDetailsForm";
import { renderWithQueryClient } from "@/test/render";
import { server } from "@/mocks/server";
import { http } from "msw";
import { resetHandlerState } from "@/mocks/handlers";
import type { useCloudinaryUploadType } from "@/shared/hooks/useCloudinaryUpload/useCloudinaryUpload";
import * as api from "../../api";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/shared/hooks", () => {
  const defaultReturn = { upload: vi.fn(), isUploading: false, error: null };
  const useCloudinaryUpload = vi.fn(() => defaultReturn);
  return { useCloudinaryUpload };
});

vi.mock("@/shared/hooks/useId3Tags", () => ({
  readId3Tags: vi.fn(),
}));

vi.mock("../SongDetailsForm/SongDetailsForm", () => ({
  SongDetailsForm: vi.fn(() => <div data-testid="song-details-form" />),
}));

const mockedUseCloudinaryUpload = vi.mocked(useCloudinaryUpload);
const mockedReadId3Tags = vi.mocked(readId3Tags);

describe("SongUploadForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHandlerState();
    mockedReadId3Tags.mockResolvedValue({});
  });

  type UploadFn = useCloudinaryUploadType["upload"];

  interface CloudinaryMockOptions {
    mp3Upload?: UploadFn;
    coverUpload?: UploadFn;
    mp3Error?: string | null;
    coverError?: string | null;
  }

  const setupCloudinaryMocks = ({
    mp3Upload = vi.fn<UploadFn>().mockResolvedValue(null),
    coverUpload = vi.fn<UploadFn>().mockResolvedValue(null),
    mp3Error = null,
    coverError = null,
  }: CloudinaryMockOptions = {}) => {
    mockedUseCloudinaryUpload
      .mockReturnValueOnce({
        upload: mp3Upload,
        isUploading: false,
        error: mp3Error,
      })
      .mockReturnValueOnce({
        upload: coverUpload,
        isUploading: false,
        error: coverError,
      });

    return { mp3Upload, coverUpload };
  };

  const getFormProps = () => vi.mocked(SongDetailsForm).mock.lastCall![0];

  describe("File Handling & Early Exits", () => {
    it("updates coverArtUrl when cover upload succeeds", async () => {
      setupCloudinaryMocks({
        coverUpload: vi
          .fn()
          .mockResolvedValue({ secure_url: "https://cdn/cover.jpg" }),
      });
      renderWithQueryClient(<SongUploadForm />);

      await act(async () => {
        await getFormProps().onCoverArtUpload!(new File([""], "cover.jpg"));
      });

      // Assert that the successful upload passes the URL down to the child component.
      expect(getFormProps().uploadedCoverUrl).toBe("https://cdn/cover.jpg");
    });

    it("returns early when selecting null files for MP3 or Cover", async () => {
      setupCloudinaryMocks();
      renderWithQueryClient(<SongUploadForm />);

      await act(async () => {
        await getFormProps().onMp3Upload!(null as unknown as File);
        await getFormProps().onCoverArtUpload!(null as unknown as File);
      });

      // No interactions should occur if files are null.
      expect(mockedReadId3Tags).not.toHaveBeenCalled();
    });

    it("logs upload errors to console if cloudinary upload fails", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      setupCloudinaryMocks({
        mp3Upload: vi.fn().mockRejectedValue(new Error("MP3 Upload Failed")),
        coverUpload: vi
          .fn()
          .mockRejectedValue(new Error("Cover Upload Failed")),
      });
      renderWithQueryClient(<SongUploadForm />);

      await act(async () => {
        await getFormProps().onMp3Upload!(new File([""], "test.mp3"));
        await getFormProps().onCoverArtUpload!(new File([""], "test.jpg"));
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "MP3 processing or upload failed:",
          expect.any(Error),
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          "Cover art upload failed:",
          expect.any(Error),
        );
      });
      consoleSpy.mockRestore();
    });
  });

  describe("Submit behavior", () => {
    it("shows the generic fallback message if submission throws a standard Error", async () => {
      setupCloudinaryMocks({
        mp3Upload: vi.fn().mockResolvedValue({
          secure_url: "https://cdn/audio.mp3",
          duration: 90,
        }),
      });

      const spy = vi
        .spyOn(api, "uploadSong")
        .mockRejectedValue(new Error("Standard raw error message"));

      renderWithQueryClient(<SongUploadForm />);

      await act(async () => {
        await getFormProps().onMp3Upload!(new File([""], "test.mp3"));
      });

      await act(async () => {
        await getFormProps().onSubmit({
          title: "",
          artist: "",
          album: "",
          release_year: undefined,
          cover_art_url: "",
        });
      });

      // It should hide the raw error and show the fallback.
      expect(
        await screen.findByText("Failed to save song to the database."),
      ).toBeInTheDocument();
      spy.mockRestore();
    });
    it("prevents submission and shows an error if no MP3 is uploaded", async () => {
      renderWithQueryClient(<SongUploadForm />);

      await act(async () => {
        await getFormProps().onSubmit({
          title: "Test",
          artist: "Artist",
          album: "",
          release_year: undefined,
          cover_art_url: "",
        });
      });

      expect(
        await screen.findByText("Please select an MP3 file."),
      ).toBeInTheDocument();
    });

    it("saves song, invalidates cache, and navigates on success", async () => {
      setupCloudinaryMocks({
        mp3Upload: vi.fn().mockResolvedValue({
          secure_url: "https://cdn/audio.mp3",
          duration: 181,
        }),
      });
      mockedReadId3Tags.mockResolvedValueOnce({
        title: "ID3 Title",
        artist: "ID3 Artist",
      });

      const { queryClient } = renderWithQueryClient(<SongUploadForm />);
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      await act(async () => {
        await getFormProps().onMp3Upload!(new File([""], "test.mp3"));
      });

      await act(async () => {
        await getFormProps().onSubmit({
          title: "",
          artist: "",
          album: "",
          release_year: undefined,
          cover_art_url: "",
        });
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: queryKeys.allSongs,
        });
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    it("shows readable generic error message when save throws a generic string", async () => {
      setupCloudinaryMocks({
        mp3Upload: vi.fn().mockResolvedValue({
          secure_url: "https://cdn/audio.mp3",
          duration: 90,
        }),
      });

      server.use(
        http.post("http://localhost:8000/api/songs/", () => {
          throw new Error("Generic failure message from server");
        }),
      );

      renderWithQueryClient(<SongUploadForm />);

      await act(async () => {
        await getFormProps().onMp3Upload!(new File([""], "test.mp3"));
      });

      await act(async () => {
        await getFormProps().onSubmit({
          title: "",
          artist: "",
          album: "",
          release_year: undefined,
          cover_art_url: "",
        });
      });

      expect(
        await screen.findByText(/Failed to save song to the database\./i),
      ).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
