import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ComponentProps } from "react";
import { SongList } from "./SongList";
import { usePlayer } from "@/shared/context/PlayerContext";
import type { Song } from "@/features/songs/types";
import type { DropdownItem } from "../SongManagementDropdown/SongManagementDropdown";
import { renderWithQueryClient } from "@/test/render";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { resetHandlerState } from "@/mocks/handlers";
import { createSong } from "@/test/factories/song";
import { createMockPlayer } from "@/test/factories/player";

vi.mock("@/shared/context/PlayerContext", () => ({
  usePlayer: vi.fn(),
}));

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
  }: {
    onClose: () => void;
    onSongUpdated: () => void;
  }) => (
    <div data-testid="edit-modal">
      <button onClick={onClose}>Close Edit</button>
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
        <button onClick={() => onSongAdded(1)}>Add to Mock Playlist</button>
      </div>
    ),
  }),
);

const mockSongs: Song[] = [
  createSong({ id: 1, title: "Song 1" }),
  createSong({ id: 2, title: "Song 2" }),
];

const setup = (props: Partial<ComponentProps<typeof SongList>> = {}) => {
  const mockPlaySong = vi.fn();
  vi.mocked(usePlayer).mockReturnValue(
    createMockPlayer({ playSong: mockPlaySong }),
  );

  const utils = renderWithQueryClient(
    <SongList songs={mockSongs} {...props} />,
  );
  return { ...utils, mockPlaySong };
};

describe("SongList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHandlerState();
  });

  describe("Playback Integration", () => {
    it("calls playSong with the clicked song and the full current playlist context", () => {
      const { mockPlaySong } = setup();

      const playButtons = screen.getAllByText("Play");
      fireEvent.click(playButtons[0]);

      expect(mockPlaySong).toHaveBeenCalledWith(mockSongs[0], mockSongs);
    });
  });

  describe("Dropdown Actions & Error Handling", () => {
    it("opens and closes the Edit modal", () => {
      setup();
      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);

      expect(screen.getByTestId("edit-modal")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Close Edit"));
      expect(screen.queryByTestId("edit-modal")).not.toBeInTheDocument();
    });

    it("triggers delete mutation, invalidates queries, and dismisses error", async () => {
      server.use(
        http.delete("http://localhost:8000/api/songs/1/", () =>
          HttpResponse.error(),
        ),
      );
      setup();

      fireEvent.click(screen.getAllByText("Delete")[0]);
      await waitFor(() =>
        expect(screen.getByRole("alert")).toBeInTheDocument(),
      );

      // Dismiss Error.
      fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
      await waitFor(() =>
        expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
      );
    });

    it("opens Add to Playlist modal, triggers mutation on add, and handles errors", async () => {
      const { queryClient } = setup();
      vi.spyOn(queryClient, "invalidateQueries");

      server.use(
        http.post("http://localhost:8000/api/playlists/1/add_song/", () =>
          HttpResponse.json({ detail: "Mock playlist error" }, { status: 400 }),
        ),
      );

      const addToPlaylistButtons = screen.getAllByText("Add to Playlist");
      fireEvent.click(addToPlaylistButtons[0]);
      fireEvent.click(screen.getByText("Add to Mock Playlist"));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
      await waitFor(() =>
        expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
      );
    });
  });
});
