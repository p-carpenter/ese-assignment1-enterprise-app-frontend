import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ComponentProps } from "react";
import { SongList } from "./SongList";
import { usePlayer } from "@/shared/context/PlayerContext";
import { deleteSong } from "../../api";
import { addSongToPlaylist } from "@/features/playlists/api";
import type { Song } from "@/features/songs/types";
import type { DropdownItem } from "../SongManagementDropdown/SongManagementDropdown";
import { queryKeys } from "@/shared/lib/queryKeys";

vi.mock("@/shared/context/PlayerContext", () => ({
  usePlayer: vi.fn(),
}));

vi.mock("../../api", () => ({
  deleteSong: vi.fn(),
}));

vi.mock("@/features/playlists/api", () => ({
  addSongToPlaylist: vi.fn(),
}));

// Mock child components.
vi.mock("../SongRow/SongRow", () => ({
  SongRow: ({
    song,
    onPlay,
    dropdownItems,
  }: {
    song: Song;
    onPlay: (song: Song) => void;
    dropdownItems: DropdownItem[];
  }) => (
    <li data-testid={`song-row-${song.id}`}>
      <span>{song.title}</span>
      <button onClick={() => onPlay(song)}>Play</button>
      {dropdownItems.map((item) => (
        <button
          key={item.label}
          onClick={item.onSelect}
          disabled={item.disabled}
        >
          {item.label}
        </button>
      ))}
    </li>
  ),
}));

vi.mock("../EditSongModal/EditSongModal", () => ({
  EditSongModal: ({
    onClose,
    onSongUpdated,
  }: {
    onClose: () => void;
    onSongUpdated: () => void;
  }) => (
    <div data-testid="edit-modal">
      <button onClick={onClose}>Close Edit</button>
      <button onClick={onSongUpdated}>Trigger Update</button>
    </div>
  ),
}));

vi.mock(
  "@/features/playlists/components/AddToPlaylistModal/AddToPlaylistModal",
  () => ({
    AddToPlaylistModal: ({
      onClose,
      onSongAdded,
    }: {
      onClose: () => void;
      onSongAdded: (playlistId: number) => void;
    }) => (
      <div data-testid="playlist-modal">
        <button onClick={onClose}>Close Playlist</button>
        <button onClick={() => onSongAdded(99)}>Add to Mock Playlist</button>
      </div>
    ),
  }),
);

vi.mock("@/shared/components/AlertMessage/AlertMessage", () => ({
  AlertMessage: ({
    message,
    onDismiss,
  }: {
    message?: string | null;
    onDismiss: () => void;
  }) =>
    message ? (
      <div data-testid="alert-message">
        {message}
        <button onClick={onDismiss}>Dismiss</button>
      </div>
    ) : null,
}));

const mockSongs: Song[] = [
  {
    id: 1,
    title: "Song 1",
    file_url: "url1",
    duration: 100,
    uploaded_at: "2024-01-01",
  } as Song,
  {
    id: 2,
    title: "Song 2",
    file_url: "url2",
    duration: 200,
    uploaded_at: "2024-01-02",
  } as Song,
];

const setup = (props: Partial<ComponentProps<typeof SongList>> = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  const mockPlaySong = vi.fn();

  vi.mocked(usePlayer).mockReturnValue({
    currentSong: null,
    playSong: mockPlaySong,
  } as unknown as ReturnType<typeof usePlayer>);

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <SongList songs={mockSongs} {...props} />
    </QueryClientProvider>,
  );

  return { ...utils, mockPlaySong, queryClient };
};

describe("SongList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering & Empty States", () => {
    it("renders 'No songs found.' when the songs array is empty", () => {
      vi.mocked(usePlayer).mockReturnValue({
        currentSong: null,
        playSong: vi.fn(),
      } as unknown as ReturnType<typeof usePlayer>);

      render(
        <QueryClientProvider client={new QueryClient()}>
          <SongList songs={[]} />
        </QueryClientProvider>,
      );
      expect(screen.getByText("No songs found.")).toBeInTheDocument();
    });

    it("renders column headers and a list of songs", () => {
      setup();
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Date Added")).toBeInTheDocument();
      expect(screen.getByTestId("song-row-1")).toBeInTheDocument();
      expect(screen.getByTestId("song-row-2")).toBeInTheDocument();
    });

    it("renders loading indicator when isFetchingNextPage is true", () => {
      const mockRef = { current: document.createElement("div") };
      setup({ isFetchingNextPage: true, loadMoreRef: mockRef });
      expect(screen.getByText("Loading more...")).toBeInTheDocument();
    });
  });

  describe("Playback Integration", () => {
    it("calls playSong with the clicked song and the full current playlist context", () => {
      const { mockPlaySong } = setup();

      const playButtons = screen.getAllByText("Play");
      fireEvent.click(playButtons[0]);

      expect(mockPlaySong).toHaveBeenCalledWith(mockSongs[0], mockSongs);
    });
  });

  describe("Default Dropdown Actions", () => {
    it("opens and closes the Edit modal", () => {
      setup();
      expect(screen.queryByTestId("edit-modal")).not.toBeInTheDocument();

      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      expect(screen.getByTestId("edit-modal")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Close Edit"));
      expect(screen.queryByTestId("edit-modal")).not.toBeInTheDocument();
    });

    it("triggers delete mutation and invalidates queries on success", async () => {
      vi.mocked(deleteSong).mockResolvedValueOnce();
      const { queryClient } = setup();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const deleteButtons = screen.getAllByText("Delete");
      fireEvent.click(deleteButtons[0]); // Delete Song 1

      await waitFor(() => {
        expect(deleteSong).toHaveBeenCalledWith(1);
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: queryKeys.allSongs,
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: queryKeys.playlists,
        });
      });
    });

    it("opens Add to Playlist modal and triggers mutation on add", async () => {
      vi.mocked(addSongToPlaylist).mockResolvedValueOnce({
        id: 99,
        name: "Mock Playlist",
        songs: [],
      } as unknown as Awaited<ReturnType<typeof addSongToPlaylist>>);

      const { queryClient } = setup();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const addToPlaylistButtons = screen.getAllByText("Add to Playlist");
      fireEvent.click(addToPlaylistButtons[0]);

      expect(screen.getByTestId("playlist-modal")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Add to Mock Playlist"));

      await waitFor(() => {
        expect(addSongToPlaylist).toHaveBeenCalledWith(99, 1);
      });

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["playlists"] });

        expect(screen.queryByTestId("playlist-modal")).not.toBeInTheDocument();
      });
    });
  });

  describe("Custom Overrides (Edge Cases)", () => {
    it("uses getDropdownItems if provided instead of default actions", () => {
      const mockCustomAction = vi.fn();
      const customDropdown = (): DropdownItem[] => [
        { label: "Custom Action", onSelect: mockCustomAction },
      ];

      setup({ getDropdownItems: customDropdown });

      expect(screen.queryByText("Edit")).not.toBeInTheDocument();
      expect(screen.queryByText("Delete")).not.toBeInTheDocument();

      const customButtons = screen.getAllByText("Custom Action");
      fireEvent.click(customButtons[0]);

      expect(mockCustomAction).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling", () => {
    it("displays an alert message when delete fails and allows dismissal", async () => {
      vi.mocked(deleteSong).mockRejectedValueOnce(
        new Error("Failed to delete song"),
      );
      setup();

      fireEvent.click(screen.getAllByText("Delete")[0]);

      await waitFor(() => {
        expect(screen.getByTestId("alert-message")).toHaveTextContent(
          "Failed to delete song",
        );
      });

      fireEvent.click(screen.getByText("Dismiss"));

      await waitFor(() => {
        expect(screen.queryByTestId("alert-message")).not.toBeInTheDocument();
      });
    });
  });
});
