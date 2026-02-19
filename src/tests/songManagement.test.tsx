import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EditSongModal } from "../components/features/songs/EditSongModal";
import { api } from "../services/api";
import { useCloudinaryUpload } from "../hooks/useCloudinaryUpload";
import type { Song } from "../types";
import { SongUploadForm } from "../components/features/songs/SongForm";
import { SongLibrary } from "../components/features/songs/SongLibrary";

vi.mock("../services/api", () => ({
  api: {
    songs: {
      upload: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("../hooks/useCloudinaryUpload", () => ({
  useCloudinaryUpload: vi.fn(),
}));

const mockedApi = api as unknown as {
  songs: {
    upload: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
};

const mockedUseCloudinary = useCloudinaryUpload as unknown as ReturnType<
  typeof vi.fn
>;

const mockSongs: Song[] = [
  {
    id: 1,
    title: "Song A",
    artist: "Artist 1",
    duration: 120,
    file_url: "http://example.com/song1.mp3",
    cover_art_url: "http://example.com/cover1.jpg",
  },
  {
    id: 2,
    title: "Song B",
    artist: "Artist 2",
    duration: 150,
    file_url: "http://example.com/song2.mp3",
    cover_art_url: "http://example.com/cover2.jpg",
  },
];

describe("Song management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseCloudinary.mockReturnValue({
      upload: vi
        .fn()
        .mockResolvedValue({
          secure_url: "http://audio.url/song.mp3",
          duration: 123,
        }),
      isUploading: false,
      error: null,
    });
  });

  describe("read", () => {
    it("renders the list of songs (read)", () => {
      const onSongClick = vi.fn();
      render(<SongLibrary songs={mockSongs} onSongClick={onSongClick} />);

      expect(screen.getByText("Song A")).toBeInTheDocument();
      expect(screen.getByText("Song B")).toBeInTheDocument();
      expect(screen.getByText("Artist 1")).toBeInTheDocument();
      expect(screen.getByText("Artist 2")).toBeInTheDocument();
    });
  });
  describe("create", () => {
    it("uploads a song and calls onUploadSuccess", async () => {
      const onUploadSuccess = vi.fn();
      mockedApi.songs.upload.mockResolvedValueOnce(mockSongs[0]);

      render(<SongUploadForm onUploadSuccess={onUploadSuccess} />);

      fireEvent.change(screen.getByPlaceholderText("Title"), {
        target: { value: "Test Song" },
      });
      fireEvent.change(screen.getByPlaceholderText("Artist"), {
        target: { value: "Test Artist" },
      });

      const file = new File(["dummy"], "test.mp3", { type: "audio/mp3" });
      const audioInput = document.querySelector(
        'input[accept="audio/*"]',
      ) as HTMLInputElement;
      fireEvent.change(audioInput, { target: { files: [file] } });

      expect(await screen.findByText("✓ Audio file ready")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /save song/i }));

      await waitFor(() => {
        expect(mockedApi.songs.upload).toHaveBeenCalledWith({
          title: "Test Song",
          artist: "Test Artist",
          cover_art_url: "",
          file_url: "http://audio.url/song.mp3",
          duration: 123,
        });
        expect(onUploadSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("update", () => {
    it("updates a song and triggers callbacks", async () => {
      const onSongUpdated = vi.fn();
      const onClose = vi.fn();
      mockedApi.songs.update.mockResolvedValueOnce({
        ...mockSongs[0],
        title: "New Title",
        artist: "New Artist",
      });

      render(
        <EditSongModal
          song={mockSongs[0]}
          isOpen={true}
          onClose={onClose}
          onSongUpdated={onSongUpdated}
        />,
      );

      fireEvent.change(screen.getByPlaceholderText("Title"), {
        target: { value: "New Title" },
      });
      fireEvent.change(screen.getByPlaceholderText("Artist"), {
        target: { value: "New Artist" },
      });

      fireEvent.click(screen.getByRole("button", { name: /save song/i }));

      await waitFor(() => {
        expect(mockedApi.songs.update).toHaveBeenCalledWith(mockSongs[0].id, {
          title: "New Title",
          artist: "New Artist",
          file_url: mockSongs[0].file_url,
          duration: mockSongs[0].duration,
          cover_art_url: mockSongs[0].cover_art_url,
        });
        expect(onSongUpdated).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe("delete", () => {
    it("calls api.songs.delete when Delete is clicked and re-renders the song list", async () => {
      (mockedApi.songs.delete as any).mockResolvedValueOnce({});
      const onSongClick = vi.fn();
      const onSongsChanged = vi.fn();

      const { rerender } = render(
        <SongLibrary
          songs={mockSongs}
          onSongClick={onSongClick}
          onSongsChanged={onSongsChanged}
        />,
      );

      const moreButtons = screen.getAllByRole("button");
      fireEvent.click(moreButtons[0]);

      const deleteOption = await screen.findByText("Delete");
      fireEvent.click(deleteOption);

      await waitFor(() => {
        expect(mockedApi.songs.delete).toHaveBeenCalledWith(mockSongs[0].id);
        expect(onSongsChanged).toHaveBeenCalled();
      });

      // Check song is deleted from the list
      rerender(
        <SongLibrary
          songs={mockSongs.filter((song) => song.id !== mockSongs[0].id)}
          onSongClick={onSongClick}
          onSongsChanged={onSongsChanged}
        />,
      );
      expect(screen.queryByText("Song A")).not.toBeInTheDocument();
    });
  });
});
