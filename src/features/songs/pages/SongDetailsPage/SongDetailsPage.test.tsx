import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SongDetailsPage } from "./SongDetailsPage";
import type { Song } from "@/features/songs/types";
import { usePlayer } from "@/shared/context/PlayerContext";
import type { PlayerContextType } from "@/shared/context/PlayerContext";
import { server } from "@/mocks/server";
import { http, HttpResponse, delay } from "msw";

vi.mock("@/shared/context/PlayerContext", () => ({
  usePlayer: vi.fn(),
}));

vi.mock("./components/SongHero/SongHero", () => ({
  SongHero: (props: { onPlayClick: () => void }) => (
    <div data-testid="song-hero">
      <button onClick={props.onPlayClick}>Play from hero</button>
    </div>
  ),
}));

vi.mock("./components/LyricsSection/LyricsSection", () => ({
  LyricsSection: () => <div data-testid="lyrics-section" />,
}));

vi.mock("./components/MoreByArtist/MoreByArtist", () => ({
  MoreByArtist: (props: { artist: string; currentSongId: number }) => (
    <div data-testid="more-by-artist">
      {props.artist}:{props.currentSongId}
    </div>
  ),
}));

vi.mock("@/shared/components/AlertMessage/AlertMessage", () => ({
  AlertMessage: ({ message }: { message: string }) => (
    <div data-testid="alert-message">{message}</div>
  ),
}));

const mockSong: Song = {
  id: 1,
  title: "Test Title",
  artist: "Test Artist",
  file_url: "https://example.com/song.mp3",
  cover_art_url: "https://placehold.co/220",
  duration: 180,
  uploaded_at: "2023-01-01T00:00:00Z",
};

const createTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderPage = (songId: string | undefined = "1") => {
  const queryClient = createTestQueryClient();
  const initialEntry = songId ? `/songs/${songId}` : "/songs";

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/songs/:id" element={<SongDetailsPage />} />
          <Route path="/songs" element={<SongDetailsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("SongDetailsPage", () => {
  const playSong = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Streng typing mot context typen vår istedenfor any.
    vi.mocked(usePlayer).mockReturnValue({
      playSong,
    } as unknown as PlayerContextType);
  });

  it("shows loading state while song data is being fetched", async () => {
    server.use(
      http.get("http://localhost:8000/api/songs/1/", async () => {
        await delay("infinite");
        return HttpResponse.json(mockSong);
      }),
    );

    renderPage();
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("calls playSong when SongHero triggers play click", async () => {
    server.use(
      http.get("http://localhost:8000/api/songs/1/", () =>
        HttpResponse.json(mockSong),
      ),
    );

    renderPage();

    const playBtn = await screen.findByRole("button", {
      name: "Play from hero",
    });
    fireEvent.click(playBtn);

    expect(playSong).toHaveBeenCalledWith(mockSong);
  });
});
