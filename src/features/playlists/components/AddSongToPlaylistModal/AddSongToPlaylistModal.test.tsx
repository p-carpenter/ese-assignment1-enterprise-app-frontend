import { screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddSongToPlaylistModal } from "./AddSongToPlaylistModal";
import { usePlayer } from "@/shared/context/PlayerContext";
import type { ComponentProps } from "react";
import { SongRow } from "@/features/songs/components/SongRow/SongRow";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { resetHandlerState } from "@/mocks/handlers";
import { renderWithQueryClient } from "@/test/render";
import { createMockPlayer } from "@/test/factories/player";
import { createPlaylist } from "@/test/factories/playlist";

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

const mockPlaylist = createPlaylist({ id: 1, title: "Vibes" });

const renderComponent = (props = {}) => {
  return renderWithQueryClient(
    <AddSongToPlaylistModal
      isOpen
      onClose={vi.fn()}
      playlistId={mockPlaylist.id}
      existingSongIds={new Set()}
      {...props}
    />,
  );
};

describe("AddSongToPlaylistModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHandlerState();
    vi.mocked(usePlayer).mockReturnValue(createMockPlayer());
  });

  describe("API Integration", () => {
    it("shows success state when song is added", async () => {
      renderComponent();

      const searchInput = screen.getByPlaceholderText(
        /search songs or artists/i,
      );
      fireEvent.change(searchInput, { target: { value: "Sky" } });

      const addButton = await screen.findByRole("button", {
        name: "Add Skyline",
      });
      fireEvent.click(addButton);

      expect(await screen.findByText("✓ 1 song added")).toBeInTheDocument();
    });

    it("shows error when the server rejects the addition", async () => {
      server.use(
        http.post("http://localhost:8000/api/playlists/:id/add_song/", () =>
          HttpResponse.json(
            { detail: "Song already exists in playlist." },
            { status: 400 },
          ),
        ),
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

    it("resets search and added state when closing", async () => {
      const onClose = vi.fn();
      renderComponent({ onClose });

      const searchInput = screen.getByPlaceholderText(
        /search songs or artists/i,
      );
      fireEvent.change(searchInput, { target: { value: "Sky" } });

      fireEvent.click(
        await screen.findByRole("button", { name: "Add Skyline" }),
      );
      expect(await screen.findByText("✓ 1 song added")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Close" }));

      expect(onClose).toHaveBeenCalledOnce();
      expect(searchInput).toHaveValue("");
      expect(screen.queryByText("✓ 1 song added")).not.toBeInTheDocument();
    });
  });
});
