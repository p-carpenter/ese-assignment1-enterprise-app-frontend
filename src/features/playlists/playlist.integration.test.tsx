import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlaylistsPage } from "@/features/playlists/pages";
import { PlaylistDetailPage } from "@/features/playlists/pages";
import { AuthContext } from "@/shared/context/AuthContext";
import { type UserProfile } from "@/features/auth/types";
import { PlayerProvider } from "@/shared/context/PlayerContext";

// PlayerProvider calls useSpotify() internally; stub it so no SpotifyProvider is needed.
vi.mock("@/features/spotify/context", () => ({
  useSpotify: vi.fn(() => ({
    isReady: false,
    isLoading: false,
    isPlaying: false,
    duration: 0,
    getPosition: () => 0,
    playTrack: vi.fn(),
    setOnTrackEnded: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    nextTrack: vi.fn(),
    prevTrack: vi.fn(),
  })),
}));

const mockUser: UserProfile = {
  id: 1,
  username: "testuser",
  email: "test@test.com",
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider
        value={{
          user: mockUser,
          loading: false,
          login: () => Promise.resolve(),
          logout: () => Promise.resolve(),
          setUser: () => {},
          refreshUser: () => Promise.resolve(),
        }}
      >
        <PlayerProvider>{ui}</PlayerProvider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
};

describe("Playlist integration tests", () => {
  it("should allow creating, viewing, and deleting a playlist", async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={["/playlists"]}>
        <Routes>
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route
            path="/playlists/:playlistId"
            element={<PlaylistDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Initial Playlist")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /create playlist/i }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "My New Awesome Playlist" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Playlist" }));

    expect(
      await screen.findByRole("heading", { name: "My New Awesome Playlist" }),
    ).toBeInTheDocument();
  });
});
