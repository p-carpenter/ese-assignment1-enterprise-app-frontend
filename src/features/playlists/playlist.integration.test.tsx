import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlaylistsPage } from "@/features/playlists/pages";
import { PlaylistDetailPage } from "@/features/playlists/pages";
import { AuthContext } from "@/shared/context/AuthContext";
import { type UserProfile } from "@/features/auth/types";
import { PlayerProvider } from "@/shared/context/PlayerContext";

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

    // Initially, see the default playlist
    expect(await screen.findByText("Initial Playlist")).toBeInTheDocument();

    // Create a new playlist
    fireEvent.click(screen.getByRole("button", { name: /create playlist/i }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "My New Awesome Playlist" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Playlist" }));

    // Wait for the new playlist to appear in the list
    expect(
      await screen.findByText("My New Awesome Playlist"),
    ).toBeInTheDocument();

    // Navigate to the new playlist's detail page
    fireEvent.click(screen.getByText("My New Awesome Playlist"));

    // Check that we are on the detail page
    expect(
      await screen.findByRole("heading", { name: "My New Awesome Playlist" }),
    ).toBeInTheDocument();
  });
});
