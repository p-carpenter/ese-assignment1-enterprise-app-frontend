import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { EditSongModal } from "./components/EditSongModal/EditSongModal";
import { useCloudinaryUpload } from "@/shared/hooks";
import type { Song } from "@/features/songs/types";
import { SongUploadForm } from "@/features/songs";
import { SongLibrary } from "@/features/songs";
import { uploadSong, deleteSong, updateSong, listSongsPaginated } from "./api";
import { useNavigate } from "react-router-dom";
import {
  usePlayer,
  type PlayerContextType,
} from "@/shared/context/PlayerContext";

vi.mock("./api", () => ({
  uploadSong: vi.fn(),
  updateSong: vi.fn(),
  deleteSong: vi.fn(),
  listSongsPaginated: vi.fn(),
}));

vi.mock("@/shared/hooks/useCloudinaryUpload", () => ({
  useCloudinaryUpload: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: vi.fn() };
});

vi.mock("@/shared/context/PlayerContext", () => ({
  usePlayer: vi.fn(),
}));

const mockUploadSong = vi.mocked(uploadSong) as unknown as ReturnType<
  typeof vi.fn
>;
const mockUpdateSong = vi.mocked(updateSong) as unknown as ReturnType<
  typeof vi.fn
>;
const mockDeleteSong = vi.mocked(deleteSong) as unknown as ReturnType<
  typeof vi.fn
>;
const mockListSongsPaginated = vi.mocked(
  listSongsPaginated,
) as unknown as ReturnType<typeof vi.fn>;

const mockedUseCloudinary = useCloudinaryUpload as unknown as ReturnType<
  typeof vi.fn
>;
const mockedUseNavigate = useNavigate as unknown as ReturnType<typeof vi.fn>;
const mockedUsePlayer = usePlayer as unknown as ReturnType<typeof vi.fn>;

const mockSongs: Song[] = [
  {
    id: 1,
    title: "Song A",
    artist: "Artist 1",
    duration: 120,
    file_url: "http://example.com/song1.mp3",
    cover_art_url: "http://example.com/cover1.jpg",
    album: "Album 1",
    release_year: "2023",
  },
  {
    id: 2,
    title: "Song B",
    artist: "Artist 2",
    duration: 150,
    file_url: "http://example.com/song2.mp3",
    cover_art_url: "http://example.com/cover2.jpg",
    album: "Album 2",
    release_year: "2024",
  },
];

const paginatedSongs = {
  count: 2,
  results: mockSongs,
  next: null,
  previous: null,
};

const emptyPaginatedSongs = {
  count: 0,
  results: [],
  next: null,
  previous: null,
};

type AnyFn = (...args: unknown[]) => unknown;

/** Shared player context mock matching the current PlayerContextType shape. */
const makePlayerMock = (overrides?: Partial<PlayerContextType>) =>
  ({
    playlist: mockSongs,
    currentSong: null,
    playSong: vi
      .fn()
      .mockResolvedValue(undefined) as unknown as PlayerContextType["playSong"],
    playPrev: vi
      .fn()
      .mockResolvedValue(undefined) as unknown as PlayerContextType["playPrev"],
    playNext: vi
      .fn()
      .mockResolvedValue(undefined) as unknown as PlayerContextType["playNext"],
    play: vi.fn() as unknown as AnyFn,
    pause: vi.fn() as unknown as AnyFn,
    seek: vi.fn() as unknown as AnyFn,
    getPosition: vi.fn().mockReturnValue(0) as unknown as () => number,
    setPlaylist: vi.fn() as unknown as PlayerContextType["setPlaylist"],
    isPlaying: false,
    isLoading: false,
    duration: 0,
    historyTick: 0,
    ...overrides,
  }) as PlayerContextType;

describe("Song management", () => {
  let mockPlaySong: PlayerContextType["playSong"];

  beforeEach(() => {
    vi.clearAllMocks();
    mockPlaySong = vi
      .fn()
      .mockResolvedValue(undefined) as unknown as PlayerContextType["playSong"];
    mockedUseNavigate.mockReturnValue(vi.fn());
    mockedUsePlayer.mockReturnValue(makePlayerMock({ playSong: mockPlaySong }));
    mockedUseCloudinary.mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        secure_url: "http://audio.url/song.mp3",
        duration: 123,
      }),
      isUploading: false,
      error: null,
    });
    mockListSongsPaginated.mockResolvedValue(paginatedSongs);
  });

  // ─── Read ────────────────────────────────────────────────────────────────
  describe("read", () => {
    it("renders the list of songs fetched from the API", async () => {
      render(<SongLibrary />);

      expect(await screen.findByText("Song A")).toBeInTheDocument();
      expect(screen.getByText("Song B")).toBeInTheDocument();
      expect(screen.getByText("Artist 1")).toBeInTheDocument();
      expect(screen.getByText("Artist 2")).toBeInTheDocument();
    });
  });

  // ─── Create ──────────────────────────────────────────────────────────────
  describe("create", () => {
    it("uploads a song and navigates home", async () => {
      mockUploadSong.mockResolvedValueOnce(mockSongs[0]);

      render(<SongUploadForm />);

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
        expect(mockUploadSong).toHaveBeenCalledWith({
          title: "Test Song",
          artist: "Test Artist",
          cover_art_url: "",
          file_url: "http://audio.url/song.mp3",
          duration: 123,
          album: "Unknown Album",
          release_year: "Unknown Year",
        });
      });
    });
  });

  // ─── Update ──────────────────────────────────────────────────────────────
  describe("update", () => {
    it("updates a song and triggers callbacks", async () => {
      const onSongUpdated = vi.fn();
      const onClose = vi.fn();
      mockUpdateSong.mockResolvedValueOnce({
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
        expect(mockUpdateSong).toHaveBeenCalledWith(mockSongs[0].id, {
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

  // ─── Delete ──────────────────────────────────────────────────────────────
  describe("delete", () => {
    it("calls deleteSong and removes the song from the rendered list", async () => {
      mockDeleteSong.mockResolvedValueOnce({});
      render(<SongLibrary />);

      await screen.findByText("Song A");

      const moreButtons = screen.getAllByRole("button");
      fireEvent.click(moreButtons[0]);

      const deleteOption = await screen.findByText("Delete");
      fireEvent.click(deleteOption);

      await waitFor(() => {
        expect(mockDeleteSong).toHaveBeenCalledWith(mockSongs[0].id);
      });

      // Song A should be absent. Song B should remain
      await waitFor(() => {
        expect(screen.queryByText("Song A")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Song B")).toBeInTheDocument();
    });

    it("shows an alert and keeps the song list intact when deleteSong fails", async () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockDeleteSong.mockRejectedValueOnce(new Error("Server error"));
      render(<SongLibrary />);

      await screen.findByText("Song A");
      fireEvent.click(screen.getAllByRole("button")[0]); // open dropdown
      fireEvent.click(await screen.findByText("Delete"));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      // Song should still be in the DOM after the failed delete
      expect(screen.getByText("Song A")).toBeInTheDocument();

      alertSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  // ─── SongLibrary display ─────────────────────────────────────────────────
  describe("SongLibrary – display", () => {
    it("shows the correct track count from the API response", async () => {
      render(<SongLibrary />);
      expect(
        await screen.findByText(/library \(2 tracks\)/i),
      ).toBeInTheDocument();
    });

    it("renders an empty library with 0 tracks", async () => {
      mockListSongsPaginated.mockResolvedValueOnce(emptyPaginatedSongs);
      render(<SongLibrary />);
      expect(
        await screen.findByText(/library \(0 tracks\)/i),
      ).toBeInTheDocument();
    });

    it("highlights the currently-playing song", async () => {
      mockedUsePlayer.mockReturnValue(
        makePlayerMock({ playSong: mockPlaySong, currentSong: mockSongs[0] }),
      );
      const { container } = render(<SongLibrary />);
      await screen.findByText("Song A");
      const firstItem = container.querySelector("li");
      expect(firstItem?.className).toMatch(/songItemActive/);
    });

    it("calls playSong with the correct song when a list item is clicked", async () => {
      render(<SongLibrary />);
      fireEvent.click(await screen.findByText("Song B"));
      expect(mockPlaySong).toHaveBeenCalledWith(mockSongs[1], mockSongs);
    });
  });

  // ─── SongLibrary sorting ─────────────────────────────────────────────────
  describe("SongLibrary – sorting", () => {
    it("re-fetches with the new ordering when the sort dropdown changes", async () => {
      render(<SongLibrary />);
      await screen.findByText("Song A");

      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "-title" },
      });

      await waitFor(() => {
        expect(mockListSongsPaginated).toHaveBeenCalledWith(1, "-title", "");
      });
    });

    it("resets to page 1 when the sort order changes", async () => {
      render(<SongLibrary />);
      await screen.findByText("Song A");

      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "uploaded_at" },
      });

      await waitFor(() => {
        expect(mockListSongsPaginated).toHaveBeenCalledWith(
          1,
          "uploaded_at",
          "",
        );
      });
    });

    it("supports all available sort options", async () => {
      const sortOptions = [
        "title",
        "-title",
        "uploaded_at",
        "-uploaded_at",
        "release_year",
        "-release_year",
        "duration",
        "-duration",
      ];

      for (const value of sortOptions) {
        vi.clearAllMocks();
        mockListSongsPaginated.mockResolvedValue(paginatedSongs);
        const { unmount } = render(<SongLibrary />);
        await screen.findByText("Song A");

        fireEvent.change(screen.getByRole("combobox"), { target: { value } });

        await waitFor(() => {
          expect(mockListSongsPaginated).toHaveBeenCalledWith(1, value, "");
        });
        unmount();
      }
    });
  });

  // ─── SongLibrary searching ───────────────────────────────────────────────
  describe("SongLibrary – searching", () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("calls listSongsPaginated with the search query after the debounce delay", async () => {
      mockListSongsPaginated.mockResolvedValue(paginatedSongs);
      render(<SongLibrary />);

      const searchInput = screen.getByPlaceholderText("Search songs...");
      fireEvent.change(searchInput, { target: { value: "Song A" } });

      // Advance timers past the 300 ms debounce
      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      await waitFor(() => {
        expect(mockListSongsPaginated).toHaveBeenCalledWith(
          1,
          "title",
          "Song A",
        );
      });
    });

    it("resets to page 1 when the search query changes", async () => {
      mockListSongsPaginated.mockResolvedValue({
        count: 1,
        results: [mockSongs[0]],
        next: null,
        previous: null,
      });
      render(<SongLibrary />);

      fireEvent.change(screen.getByPlaceholderText("Search songs..."), {
        target: { value: "Artist" },
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      await waitFor(() => {
        expect(mockListSongsPaginated).toHaveBeenCalledWith(
          1,
          "title",
          "Artist",
        );
      });
    });

    it("does not fire an extra API call before the debounce window elapses", async () => {
      render(<SongLibrary />);
      // Let the initial fetch complete before timing tests
      await act(async () => {
        vi.advanceTimersByTime(0);
      });
      mockListSongsPaginated.mockClear();

      fireEvent.change(screen.getByPlaceholderText("Search songs..."), {
        target: { value: "x" },
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockListSongsPaginated).not.toHaveBeenCalled();
    });

    it("handles an API error during search gracefully", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      render(<SongLibrary />);

      mockListSongsPaginated.mockRejectedValueOnce(new Error("Search failed"));
      fireEvent.change(screen.getByPlaceholderText("Search songs..."), {
        target: { value: "bad" },
      });

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
      consoleSpy.mockRestore();
    });
  });

  // ─── SongLibrary pagination ──────────────────────────────────────────────
  describe("SongLibrary – pagination", () => {
    it("fetches page 1 with the default ordering on mount", async () => {
      render(<SongLibrary />);
      await screen.findByText("Song A");
      expect(mockListSongsPaginated).toHaveBeenCalledWith(1, "title", "");
    });

    it("appends songs from subsequent pages without replacing the first page", async () => {
      const page1 = {
        count: 2,
        results: [mockSongs[0]],
        next: "...",
        previous: null,
      };
      const page2 = {
        count: 2,
        results: [mockSongs[1]],
        next: null,
        previous: "...",
      };
      mockListSongsPaginated
        .mockResolvedValueOnce(page1)
        .mockResolvedValueOnce(page2);

      const { container } = render(<SongLibrary />);
      expect(await screen.findByText("Song A")).toBeInTheDocument();

      // Simulate an infinite-scroll trigger by firing the scroll event
      // on the scroll container with properties that satisfy the threshold
      const scrollContainer = container.querySelector(
        '[class*="scrollContainer"]',
      ) as HTMLElement;

      if (scrollContainer) {
        Object.defineProperty(scrollContainer, "scrollTop", {
          value: 1000,
          writable: true,
          configurable: true,
        });
        Object.defineProperty(scrollContainer, "clientHeight", {
          value: 100,
          writable: true,
          configurable: true,
        });
        Object.defineProperty(scrollContainer, "scrollHeight", {
          value: 1050,
          writable: true,
          configurable: true,
        });
        fireEvent.scroll(scrollContainer);
      }

      await waitFor(() => {
        expect(mockListSongsPaginated).toHaveBeenCalledWith(2, "title", "");
      });

      // Both pages should be visible simultaneously
      expect(screen.getByText("Song A")).toBeInTheDocument();
      expect(screen.getByText("Song B")).toBeInTheDocument();
    });

    it("does not fetch the next page when all songs are already loaded", async () => {
      // count == results.length means no more pages
      mockListSongsPaginated.mockResolvedValue(paginatedSongs);

      const { container } = render(<SongLibrary />);
      await screen.findByText("Song A");
      mockListSongsPaginated.mockClear();

      const scrollContainer = container.querySelector(
        '[class*="scrollContainer"]',
      ) as HTMLElement;

      if (scrollContainer) {
        Object.defineProperty(scrollContainer, "scrollTop", {
          value: 9999,
          writable: true,
          configurable: true,
        });
        Object.defineProperty(scrollContainer, "clientHeight", {
          value: 100,
          writable: true,
          configurable: true,
        });
        Object.defineProperty(scrollContainer, "scrollHeight", {
          value: 10050,
          writable: true,
          configurable: true,
        });
        fireEvent.scroll(scrollContainer);
      }

      // Give any pending effects a chance to run
      await act(async () => {});
      expect(mockListSongsPaginated).not.toHaveBeenCalled();
    });

    it("shows a loading indicator while a fetch is in progress", async () => {
      let resolve!: (v: typeof paginatedSongs) => void;
      mockListSongsPaginated.mockReturnValueOnce(
        new Promise<typeof paginatedSongs>((r) => {
          resolve = r;
        }),
      );

      render(<SongLibrary />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();

      await act(async () => {
        resolve(paginatedSongs);
      });

      await waitFor(() =>
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument(),
      );
    });

    it("handles an API error on initial load gracefully", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockListSongsPaginated.mockRejectedValueOnce(new Error("Network error"));

      render(<SongLibrary />);

      await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
      consoleSpy.mockRestore();
    });
  });

  // ─── EditSongModal edge cases ────────────────────────────────────────────
  describe("EditSongModal – edge cases", () => {
    it("renders nothing when song prop is null", () => {
      const { container } = render(
        <EditSongModal
          song={null}
          isOpen={true}
          onClose={vi.fn()}
          onSongUpdated={vi.fn()}
        />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when isOpen is false", () => {
      render(
        <EditSongModal
          song={mockSongs[0]}
          isOpen={false}
          onClose={vi.fn()}
          onSongUpdated={vi.fn()}
        />,
      );
      expect(screen.queryByText("Edit Song")).not.toBeInTheDocument();
    });
  });

  // ─── SongUploadForm validation ───────────────────────────────────────────
  describe("SongUploadForm – validation", () => {
    it("submit button is disabled until an audio file is selected", () => {
      render(<SongUploadForm />);
      expect(screen.getByRole("button", { name: /save song/i })).toBeDisabled();
    });

    it("disabled submit button prevents upload without an audio file", async () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      render(<SongUploadForm />);
      expect(screen.getByRole("button", { name: /save song/i })).toBeDisabled();
      alertSpy.mockRestore();
    });
  });
});
