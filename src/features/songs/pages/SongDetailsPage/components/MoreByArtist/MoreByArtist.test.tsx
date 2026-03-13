import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MoreByArtist } from "./MoreByArtist";
import type { Song } from "@/features/songs/types";

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));
vi.mock("react-router-dom", () => ({ useNavigate: vi.fn() }));

describe("MoreByArtist", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  it("renders nothing when there are no other songs by the artist", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: [{ id: 1, artist: "Artist", title: "Song 1" } as Song],
      isLoading: false,
      isError: false,
    } as unknown as UseQueryResult<Song[], Error>);

    const { container } = render(
      <MoreByArtist artist="Artist" currentSongId={1} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows other songs and navigates when one is clicked", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: [
        { id: 1, artist: "Artist", title: "Current Song" } as Song,
        {
          id: 2,
          artist: "Artist",
          title: "Other Song",
          release_year: "2023",
        } as Song,
      ],
      isLoading: false,
      isError: false,
    } as unknown as UseQueryResult<Song[], Error>);

    render(<MoreByArtist artist="Artist" currentSongId={1} />);

    expect(screen.getByText("More by Artist")).toBeInTheDocument();
    expect(screen.getByText("Other Song")).toBeInTheDocument();

    const songButton = screen.getByText("Other Song").closest("button")!;
    fireEvent.click(songButton);
    expect(mockNavigate).toHaveBeenCalledWith("/songs/2");
  });
});
