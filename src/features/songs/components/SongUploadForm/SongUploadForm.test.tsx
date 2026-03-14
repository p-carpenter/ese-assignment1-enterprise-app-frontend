import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { SongUploadForm } from "./SongUploadForm";
import { useCloudinaryUpload } from "@/shared/hooks/useCloudinaryUpload";
import { readId3Tags } from "@/shared/hooks/useId3Tags";
import { uploadSong } from "../../api";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";
import { queryKeys } from "@/shared/lib/queryKeys";
import { SongDetailsForm } from "../SongDetailsForm/SongDetailsForm";

const mockNavigate = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: vi.fn() };
});

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: vi.fn(),
}));

vi.mock("@/shared/hooks/useCloudinaryUpload", () => ({
  useCloudinaryUpload: vi.fn(),
}));

vi.mock("@/shared/hooks/useId3Tags", () => ({
  readId3Tags: vi.fn(),
}));

vi.mock("../../api", () => ({
  uploadSong: vi.fn(),
}));

vi.mock("../SongDetailsForm/SongDetailsForm", () => ({
  SongDetailsForm: vi.fn(() => <div data-testid="song-details-form" />),
}));

const mockedUseCloudinaryUpload = vi.mocked(useCloudinaryUpload);
const mockedReadId3Tags = vi.mocked(readId3Tags);
const mockedUploadSong = vi.mocked(uploadSong);
const mockedUseNavigate = vi.mocked(useNavigate);
const mockedUseQueryClient = vi.mocked(useQueryClient);

describe("SongUploadForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
    mockedUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as never);
  });

  const setupCloudinaryMocks = ({
    mp3Upload = vi.fn(),
    coverUpload = vi.fn(),
    mp3Error = null,
    coverError = null,
    isMp3Uploading = false,
    isCoverUploading = false,
  }: {
    mp3Upload?: ReturnType<typeof vi.fn>;
    coverUpload?: ReturnType<typeof vi.fn>;
    mp3Error?: string | null;
    coverError?: string | null;
    isMp3Uploading?: boolean;
    isCoverUploading?: boolean;
  } = {}) => {
    let callIndex = 0;
    mockedUseCloudinaryUpload.mockImplementation(() => {
      callIndex += 1;
      if (callIndex % 2 === 1) {
        return { upload: mp3Upload, isUploading: isMp3Uploading, error: mp3Error } as never;
      }
      return { upload: coverUpload, isUploading: isCoverUploading, error: coverError } as never;
    });

    return { mp3Upload, coverUpload };
  };

  const getFormProps = () => {
    return vi.mocked(SongDetailsForm).mock.lastCall![0];
  };

  describe("Upload state and validation", () => {
    it("shows combined MP3 and cover upload errors", () => {
      setupCloudinaryMocks({ mp3Error: "mp3 failed", coverError: "cover failed" });
      render(<SongUploadForm />);
      
      expect(screen.getByText(/MP3 Upload Error: mp3 failed/i)).toBeInTheDocument();
      expect(screen.getByText(/Cover Art Error: cover failed/i)).toBeInTheDocument();
    });

    it("shows submit error when submitting before MP3 is uploaded", async () => {
      setupCloudinaryMocks();
      render(<SongUploadForm />);

      act(() => {
        getFormProps().onSubmit({ title: "", artist: "", album: "", releaseYear: "" });
      });

      expect(await screen.findByText(/please select an mp3 file/i)).toBeInTheDocument();
      expect(mockedUploadSong).not.toHaveBeenCalled();
    });
  });

  describe("MP3 and metadata handling", () => {
    it("uploads MP3, reads ID3 tags, and passes them as initialValues", async () => {
      const { mp3Upload } = setupCloudinaryMocks({
        mp3Upload: vi.fn().mockResolvedValue({ secure_url: "https://cdn/audio.mp3", duration: 123.8 }),
      });
      mockedReadId3Tags.mockResolvedValueOnce({
        title: "ID3 Title", artist: "ID3 Artist", album: "ID3 Album", year: "2001",
      });

      render(<SongUploadForm />);

      const file = new File(["audio"], "picked.mp3", { type: "audio/mp3" });
      
      await act(async () => {
        getFormProps().onMp3Upload!(file);
      });

      expect(mp3Upload).toHaveBeenCalledTimes(1);
      expect(mockedReadId3Tags).toHaveBeenCalledWith(file);

      const updatedProps = getFormProps();
      expect(updatedProps.initialValues).toEqual({
        title: "ID3 Title",
        artist: "ID3 Artist",
        album: "ID3 Album",
        releaseYear: "2001",
      });
    });

    it("passes uploading state correctly to form", () => {
      setupCloudinaryMocks({ isMp3Uploading: true });
      render(<SongUploadForm />);
      expect(getFormProps().mp3Label).toBe("Uploading MP3...");
    });
  });

  describe("Submit behavior", () => {
    it("saves song, invalidates cache, and navigates on success", async () => {
      const { mp3Upload, coverUpload } = setupCloudinaryMocks({
        mp3Upload: vi.fn().mockResolvedValue({ secure_url: "https://cdn/audio.mp3", duration: 181 }),
        coverUpload: vi.fn().mockResolvedValue({ secure_url: "https://cdn/cover.jpg" }),
      });
      mockedReadId3Tags.mockResolvedValueOnce({ title: "ID3 Title", artist: "ID3 Artist", album: "ID3 Album", year: "1999" });
      mockedUploadSong.mockResolvedValueOnce({} as never);

      render(<SongUploadForm />);

      await act(async () => {
        getFormProps().onMp3Upload!(new File([""], "test.mp3"));
        getFormProps().onCoverArtUpload!(new File([""], "cover.jpg"));
      });
      
      await waitFor(() => expect(mp3Upload).toHaveBeenCalled());
      await waitFor(() => expect(coverUpload).toHaveBeenCalled());

      await act(async () => {
        getFormProps().onSubmit({ title: "", artist: "", album: "", releaseYear: "" });
      });

      expect(mockedUploadSong).toHaveBeenCalledWith({
        title: "ID3 Title",
        artist: "ID3 Artist",
        file_url: "https://cdn/audio.mp3",
        cover_art_url: "https://cdn/cover.jpg",
        duration: 181,
        album: "ID3 Album",
        release_year: "1999",
      });

      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.allSongs });
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("uses manual form values over ID3 fallback values", async () => {
      const { mp3Upload } = setupCloudinaryMocks({
        mp3Upload: vi.fn().mockResolvedValue({ secure_url: "https://cdn/audio.mp3", duration: 200 }),
      });
      mockedReadId3Tags.mockResolvedValueOnce({ title: "ID3 Title", artist: "ID3 Artist" });
      mockedUploadSong.mockResolvedValueOnce({} as never);

      render(<SongUploadForm />);

      await act(async () => {
        getFormProps().onMp3Upload!(new File([""], "test.mp3"));
      });
      await waitFor(() => expect(mp3Upload).toHaveBeenCalled());

      await act(async () => {
        getFormProps().onSubmit({
          title: "Manual Title",
          artist: "Manual Artist",
          album: "Manual Album",
          releaseYear: "2024",
        });
      });

      expect(mockedUploadSong).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Manual Title",
          artist: "Manual Artist",
          album: "Manual Album",
          release_year: "2024",
        })
      );
    });

    it("shows readable ApiError message when save fails", async () => {
      const { mp3Upload } = setupCloudinaryMocks({
        mp3Upload: vi.fn().mockResolvedValue({ secure_url: "https://cdn/audio.mp3", duration: 90 }),
      });
      mockedUploadSong.mockRejectedValueOnce(new ApiError(400, { detail: "Validation failed" }));

      render(<SongUploadForm />);

      await act(async () => { getFormProps().onMp3Upload!(new File([""], "t")); });
      await waitFor(() => expect(mp3Upload).toHaveBeenCalled());

      await act(async () => {
        getFormProps().onSubmit({ title: "", artist: "", album: "", releaseYear: "" });
      });

      expect(await screen.findByText(/validation failed/i)).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});