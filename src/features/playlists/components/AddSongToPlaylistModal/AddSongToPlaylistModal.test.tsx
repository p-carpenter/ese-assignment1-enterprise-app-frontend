import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AddSongToPlaylistModal } from "./AddSongToPlaylistModal";
import { ApiError } from "@/shared/api/errors";
import type { Song } from "@/features/songs/types";
import type { Playlist } from "../../types";
import * as songsApi from "@/features/songs/api";
import * as playlistsApi from "@/features/playlists/api";
import { usePlayer } from "@/shared/context/PlayerContext";
import type { PlayerContextType } from "@/shared/context/PlayerContext";
import type { ComponentProps } from "react";
import { SongRow } from "@/features/songs/components/SongRow/SongRow";

vi.mock("@/features/songs/api", () => ({
  listAllSongs: vi.fn(),
}));

vi.mock("@/features/playlists/api", () => ({
  addSongToPlaylist: vi.fn(),
}));

vi.mock("@/shared/context/PlayerContext", () => ({
  usePlayer: vi.fn(),
}));

vi.mock("@/features/songs/components/SongRow/SongRow", () => ({
  SongRow: (props: ComponentProps<typeof SongRow>) => (
    <li>
      <button onClick={() => props.onPlay(props.song)}>
        Add {props.song.title}
      </button>
      {props.isActive && <span data-testid={`active-${props.song.id}`} />}
    </li>
  ),
}));

const songs: Song[] = [
  {
    id: 1,
    title: "Skyline",
    artist: "Nova",
    file_url: "url1",
    duration: 160,
    cover_art_url: "https://placehold.co/220",
    uploaded_at: "2024-01-01",
  },
  {
    id: 2,
    title: "Sunset",
    artist: "Wave",
    file_url: "url2",
    duration: 140,
    cover_art_url: "https://placehold.co/220",
    uploaded_at: "2024-01-02",
  },
];

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

describe("AddSongToPlaylistModal", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createTestQueryClient();
    vi.spyOn(queryClient, "invalidateQueries");

    vi.mocked(usePlayer).mockReturnValue({
      currentSong: null,
    } as unknown as PlayerContextType);
    vi.mocked(songsApi.listAllSongs).mockResolvedValue(songs);
  });

  const renderComponent = (
    props: Partial<ComponentProps<typeof AddSongToPlaylistModal>> = {},
  ) =>
    render(
      <QueryClientProvider client={queryClient}>
        <AddSongToPlaylistModal
          playlistId={10}
          existingSongIds={new Set()}
          isOpen={true}
          onClose={vi.fn()}
          {...props}
        />
      </QueryClientProvider>,
    );

  describe("Rendering & State", () => {
    it("shows loading state", () => {
      vi.mocked(songsApi.listAllSongs).mockImplementation(
        () => new Promise(() => {}),
      );
      renderComponent();
      expect(screen.getByText("Loading songs…")).toBeInTheDocument();
    });

    it("shows error when song list query fails", async () => {
      vi.mocked(songsApi.listAllSongs).mockRejectedValue(
        new Error("Network Error"),
      );
      renderComponent();
      expect(
        await screen.findByText("Failed to load songs."),
      ).toBeInTheDocument();
    });

    it("filters out songs already in the playlist", async () => {
      renderComponent({ existingSongIds: new Set([1]) });
      await waitFor(() => {
        expect(screen.queryByText("Add Skyline")).not.toBeInTheDocument();
        expect(screen.getByText("Add Sunset")).toBeInTheDocument();
      });
    });

    it("shows empty state for no matches when searching", async () => {
      renderComponent();
      await screen.findByText("Add Skyline");
      fireEvent.change(
        screen.getByPlaceholderText(/search songs or artists/i),
        {
          target: { value: "not-found" },
        },
      );
      expect(screen.getByText("No matches found.")).toBeInTheDocument();
    });

    it("shows all-added message when no songs are available to add", async () => {
      renderComponent({ existingSongIds: new Set([1, 2]) });
      expect(
        await screen.findByText("All songs are already in this playlist."),
      ).toBeInTheDocument();
    });

    it("marks row active when current song matches", async () => {
      vi.mocked(usePlayer).mockReturnValue({
        currentSong: { id: 2 },
      } as unknown as PlayerContextType);
      renderComponent();
      expect(await screen.findByTestId("active-2")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("adds a song, shows feedback, and invalidates playlist queries", async () => {
      vi.mocked(playlistsApi.addSongToPlaylist).mockResolvedValue(
        undefined as unknown as Playlist,
      );
      renderComponent({ playlistId: 77 });

      const addButton = await screen.findByRole("button", {
        name: "Add Skyline",
      });
      fireEvent.click(addButton);

      expect(await screen.findByText("✓ 1 song added")).toBeInTheDocument();

      await waitFor(() => {
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
          queryKey: ["playlist", 77],
        });
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
          queryKey: ["playlists"],
        });
      });
    });

    it("shows API-readable mutation errors", async () => {
      vi.mocked(playlistsApi.addSongToPlaylist).mockRejectedValue(
        new ApiError(400, { detail: "Song already exists in playlist." }),
      );
      renderComponent();

      const addButton = await screen.findByRole("button", {
        name: "Add Skyline",
      });
      fireEvent.click(addButton);

      expect(
        await screen.findByText("Song already exists in playlist."),
      ).toBeInTheDocument();
    });

    it("shows fallback error message if error is not ApiError", async () => {
      vi.mocked(playlistsApi.addSongToPlaylist).mockRejectedValue(
        "not-an-error-object",
      );
      renderComponent();

      const addButton = await screen.findByRole("button", {
        name: "Add Skyline",
      });
      fireEvent.click(addButton);

      expect(await screen.findByText(/unexpected error/i)).toBeInTheDocument();
    });

    it("resets search and added state when closing", async () => {
      const onClose = vi.fn();
      vi.mocked(playlistsApi.addSongToPlaylist).mockResolvedValue(
        undefined as unknown as Playlist,
      );
      renderComponent({ onClose });

      await screen.findByText("Add Skyline");
      const searchInput = screen.getByPlaceholderText(
        /search songs or artists/i,
      );
      fireEvent.change(searchInput, { target: { value: "sky" } });

      fireEvent.click(screen.getByRole("button", { name: "Add Skyline" }));
      expect(await screen.findByText("✓ 1 song added")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Close" }));

      expect(onClose).toHaveBeenCalledOnce();
      expect(searchInput).toHaveValue("");
      expect(screen.queryByText("✓ 1 song added")).not.toBeInTheDocument();
    });
  });
});
