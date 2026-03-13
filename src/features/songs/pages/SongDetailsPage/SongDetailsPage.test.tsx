// src/features/songs/pages/SongDetailsPage/SongDetailsPage.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { SongDetailsPage } from "./SongDetailsPage";
import type { Song } from "@/features/songs/types";

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));
vi.mock("react-router-dom", () => ({ useParams: vi.fn() }));

// Mock the exact import paths used by the component.
vi.mock("./components/SongHero/SongHero", () => ({
  SongHero: () => <div data-testid="song-hero" />,
}));
vi.mock("./components/LyricsSection/LyricsSection", () => ({
  LyricsSection: () => <div data-testid="lyrics-section" />,
}));
vi.mock("./components/MoreByArtist/MoreByArtist", () => ({
  MoreByArtist: () => <div data-testid="more-by-artist" />,
}));

// Mock AlertMessage so error content can be asserted precisely.
vi.mock("@/shared/components/AlertMessage/AlertMessage", () => ({
  AlertMessage: ({ message }: { message: string }) => (
    <div data-testid="alert-message">{message}</div>
  ),
}));

// Valid Song-shaped test object.
const mockSong: Song = {
  id: 1,
  title: "Test Title",
  artist: "Test Artist",
  file_url: "https://example.com/song.mp3",
  duration: 180,
  uploaded_at: "2023-01-01T00:00:00Z",
};

describe("SongDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while song data is being fetched", () => {
    vi.mocked(useParams).mockReturnValue({ id: "1" });
    vi.mocked(useQuery).mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
    } as unknown as UseQueryResult<Song, Error>);

    render(<SongDetailsPage />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("shows an error message when the query fails", () => {
    vi.mocked(useParams).mockReturnValue({ id: "1" });
    vi.mocked(useQuery).mockReturnValue({
      isLoading: false,
      isError: true,
      data: undefined,
    } as unknown as UseQueryResult<Song, Error>);

    render(<SongDetailsPage />);
    expect(screen.getByTestId("alert-message")).toHaveTextContent(
      "Song not found or an error has occurred.",
    );
  });

  it("shows an error message when the request succeeds but no song is returned", () => {
    vi.mocked(useParams).mockReturnValue({ id: "1" });
    vi.mocked(useQuery).mockReturnValue({
      isLoading: false,
      isError: false,
      data: null,
    } as unknown as UseQueryResult<Song, Error>);

    render(<SongDetailsPage />);
    expect(screen.getByTestId("alert-message")).toBeInTheDocument();
  });

  it("renders child sections when song data is available", () => {
    vi.mocked(useParams).mockReturnValue({ id: "1" });
    vi.mocked(useQuery).mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockSong,
    } as unknown as UseQueryResult<Song, Error>);

    render(<SongDetailsPage />);

    expect(screen.getByTestId("song-hero")).toBeInTheDocument();
    expect(screen.getByTestId("lyrics-section")).toBeInTheDocument();
    expect(screen.getByTestId("more-by-artist")).toBeInTheDocument();
  });
});
