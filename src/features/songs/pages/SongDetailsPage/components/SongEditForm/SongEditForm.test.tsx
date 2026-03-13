import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SongEditForm } from "./SongEditForm";
import { updateSong } from "@/features/songs/api";
import { queryKeys } from "@/shared/lib/queryKeys";
import { ApiError } from "@/shared/api/errors";

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock("@/features/songs/api", () => ({
  updateSong: vi.fn(),
}));

type MutationOptionsShape = {
  mutationFn: () => Promise<unknown>;
  onSuccess?: () => void;
};

describe("SongEditForm", () => {
  const mockOnClose = vi.fn();
  const mockMutate = vi.fn();
  const mockInvalidateQueries = vi.fn();

  // Keep this shape aligned with the component's song prop contract.
  const dummySong = {
    id: 1,
    title: "Old Title",
    artist: "Old Artist",
    album: "Old Album",
    release_year: "2001",
    file_url: "https://example.com/song.mp3",
    duration: 100,
    cover_art_url: "https://example.com/cover.jpg",
  };

  const updatedSongResponse = {
    ...dummySong,
    uploaded_at: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(updateSong).mockResolvedValue(updatedSongResponse);

    vi.mocked(useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    } as unknown as ReturnType<typeof useQueryClient>);

    vi.mocked(useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useMutation>);
  });

  const getMutationOptions = (): MutationOptionsShape => {
    const calls = vi.mocked(useMutation).mock.calls;
    const latestCallArg = calls[calls.length - 1]?.[0];
    return latestCallArg as MutationOptionsShape;
  };

  it("updates input state and calls save on submit", () => {
    render(<SongEditForm song={dummySong} onClose={mockOnClose} />);

    const titleInput = screen.getByPlaceholderText("Title");
    fireEvent.change(titleInput, { target: { value: "New Title" } });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(mockMutate).toHaveBeenCalled();
  });

  it("calls updateSong with edited values from the mutationFn", async () => {
    render(<SongEditForm song={dummySong} onClose={mockOnClose} />);

    fireEvent.change(screen.getByPlaceholderText("Title"), {
      target: { value: "New Title" },
    });
    fireEvent.change(screen.getByPlaceholderText("Artist"), {
      target: { value: "New Artist" },
    });
    fireEvent.change(screen.getByPlaceholderText("Album"), {
      target: { value: "New Album" },
    });
    fireEvent.change(screen.getByPlaceholderText("Release year"), {
      target: { value: "2024" },
    });

    const options = getMutationOptions();
    await options.mutationFn();

    expect(updateSong).toHaveBeenCalledWith(1, {
      title: "New Title",
      artist: "New Artist",
      album: "New Album",
      release_year: "2024",
      file_url: "https://example.com/song.mp3",
      duration: 100,
      cover_art_url: "https://example.com/cover.jpg",
    });
  });

  it("invalidates song and songs queries and closes on mutation success", () => {
    render(<SongEditForm song={dummySong} onClose={mockOnClose} />);

    const options = getMutationOptions();
    options.onSuccess?.();

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.song(dummySong.id),
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.allSongs,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("disables save button and shows saving label while mutation is pending", () => {
    vi.mocked(useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useMutation>);

    render(<SongEditForm song={dummySong} onClose={mockOnClose} />);

    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveTextContent("Saving…");
  });

  it("shows readable API error message when save fails with ApiError", () => {
    const apiError = new ApiError(400, {
      detail: "Invalid data",
      non_field_errors: ["Could not save"],
    });

    vi.mocked(useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: apiError,
    } as unknown as ReturnType<typeof useMutation>);

    render(<SongEditForm song={dummySong} onClose={mockOnClose} />);

    expect(screen.getByText("Could not save Invalid data")).toBeInTheDocument();
  });

  it("shows generic error message when save fails with unknown error", () => {
    vi.mocked(useMutation).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: new Error("Unexpected failure"),
    } as unknown as ReturnType<typeof useMutation>);

    render(<SongEditForm song={dummySong} onClose={mockOnClose} />);

    expect(screen.getByText("Unexpected failure")).toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", () => {
    render(<SongEditForm song={dummySong} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
