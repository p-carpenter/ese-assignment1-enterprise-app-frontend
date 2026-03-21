import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useQuery } from "@tanstack/react-query";
import { AddToPlaylistModal } from "./AddToPlaylistModal";
import type { Song } from "@/features/songs/types";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

const { mockUseQuery, mockUseNavigate, mockCreateModal } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockUseNavigate: vi.fn(),
  mockCreateModal: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({ useQuery: mockUseQuery }));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => mockUseNavigate };
});

vi.mock("../CreateNewPlaylistModal", () => ({
  CreateNewPlaylistModal: (props: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (playlist: { id: number }) => void;
  }) => {
    mockCreateModal(props);
    if (!props.isOpen) return null;
    return (
      <div data-testid="create-playlist-modal">
        <button onClick={() => props.onSuccess({ id: 42 })}>
          Finish create
        </button>
        <button onClick={props.onClose}>Cancel create</button>
      </div>
    );
  },
}));

const song: Song = {
  id: 10,
  title: "City Lights",
  artist: "Aurora",
  file_url: "https://example.com/10.mp3",
  cover_art_url: "https://placehold.co/220",
  duration: 200,
  uploaded_at: "2024-01-01T00:00:00Z",
};

describe("AddToPlaylistModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: [
        {
          id: 1,
          title: "Road Trip",
          description: "",
          is_public: true,
          is_collaborative: false,
          cover_art_url: null,
          owner: { id: 1, username: "owner" },
          songs: [],
        },
      ],
      isLoading: false,
      isError: false,
    });
  });

  describe("Rendering & States", () => {
    it("shows loading state", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: true,
        isError: false,
      });
      render(
        <AddToPlaylistModal
          song={song}
          isOpen={true}
          onClose={vi.fn()}
          onSongAdded={vi.fn()}
        />,
      );
      expect(screen.getByText("Loading playlists...")).toBeInTheDocument();
    });

    it("shows query error state", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        isError: true,
      });
      render(
        <AddToPlaylistModal
          song={song}
          isOpen={true}
          onClose={vi.fn()}
          onSongAdded={vi.fn()}
        />,
      );
      expect(screen.getByText("Failed to load playlists.")).toBeInTheDocument();
    });

    it("wires query to modal open state", () => {
      render(
        <AddToPlaylistModal
          song={song}
          isOpen={false}
          onClose={vi.fn()}
          onSongAdded={vi.fn()}
        />,
      );
      expect(useQuery).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: false, queryKey: ["playlists"] }),
      );
    });
  });

  describe("Interactions", () => {
    it("calls onSongAdded and onClose when an existing playlist is selected", () => {
      const onSongAdded = vi.fn();
      const onClose = vi.fn();
      render(
        <AddToPlaylistModal
          song={song}
          isOpen={true}
          onClose={onClose}
          onSongAdded={onSongAdded}
        />,
      );

      fireEvent.click(screen.getByText("Road Trip"));
      expect(onSongAdded).toHaveBeenCalledWith(1);
      expect(onClose).toHaveBeenCalledOnce();
    });

    it("opens create modal from the create option", () => {
      render(
        <AddToPlaylistModal
          song={song}
          isOpen={true}
          onClose={vi.fn()}
          onSongAdded={vi.fn()}
        />,
      );
      fireEvent.click(screen.getByText("+ Create New Playlist"));
      expect(screen.getByTestId("create-playlist-modal")).toBeInTheDocument();
    });

    it("handles create success: closes, reports added song, and navigates", () => {
      const onSongAdded = vi.fn();
      const onClose = vi.fn();
      render(
        <AddToPlaylistModal
          song={song}
          isOpen={true}
          onClose={onClose}
          onSongAdded={onSongAdded}
        />,
      );

      fireEvent.click(screen.getByText("+ Create New Playlist"));
      fireEvent.click(screen.getByText("Finish create"));

      expect(onSongAdded).toHaveBeenCalledWith(42);
      expect(onClose).toHaveBeenCalledOnce();
      expect(mockUseNavigate).toHaveBeenCalledWith("/playlists/42");
    });

    it("shows fallback error message if error is not ApiError", async () => {
      render(
        <AddToPlaylistModal
          song={song}
          isOpen={true}
          onClose={vi.fn()}
          onSongAdded={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByText(/finish create/i));
      expect(
        await screen.findByText(/unexpected error|failed/i),
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have no accessibility violations when open", async () => {
      const { container } = render(
        <AddToPlaylistModal
          song={song}
          isOpen={true}
          onClose={vi.fn()}
          onSongAdded={vi.fn()}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
