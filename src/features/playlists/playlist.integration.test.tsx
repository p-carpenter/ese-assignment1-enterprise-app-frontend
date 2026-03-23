import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PlaylistsPage, PlaylistDetailPage } from "@/features/playlists/pages";
import { AuthContext } from "@/shared/context/AuthContext";
import { type UserProfile } from "@/features/auth/types";
import { PlayerProvider } from "@/shared/context/PlayerContext";
import { renderWithQueryClient } from "@/test/render";

const mockUser: UserProfile = {
  id: 1,
  username: "testuser",
  email: "test@test.com",
};

const renderWithProviders = (ui: React.ReactElement) => {
  return renderWithQueryClient(
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
    </AuthContext.Provider>,
  );
};

describe("Playlist Integration Workflows", () => {
  describe("Playlist Lifecycle", () => {
    it("allows creating, viewing, and navigating playlists seamlessly", async () => {
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
      await waitFor(() =>
        expect(screen.getByRole("dialog")).toBeInTheDocument(),
      );

      fireEvent.change(screen.getByLabelText(/title/i), {
        target: { value: "My New Awesome Playlist" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Create Playlist" }));

      expect(
        await screen.findByRole("heading", { name: "My New Awesome Playlist" }),
      ).toBeInTheDocument();
    });
  });
});
