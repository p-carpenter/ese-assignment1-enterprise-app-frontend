import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { PlaylistList } from "./PlaylistList";
import { AuthContext } from "@/shared/context/AuthContext";
import { MemoryRouter } from "react-router-dom";
import type { Playlist } from "../types";
import { type UserProfile } from "@/features/auth/types";
import { server } from "@/mocks/server";
import { http, HttpResponse, delay } from "msw";
import { resetHandlerState } from "@/mocks/handlers";

const mockPlaylists: Playlist[] = [
  {
    id: 1,
    title: "Rock Classics",
    description: "The best rock songs",
    songs: [],
    is_public: false,
    owner: 1,
  },
  {
    id: 2,
    title: "Jazz Vibes",
    description: "Smooth jazz for relaxing",
    songs: [],
    is_public: false,
    owner: 1,
  },
];

const mockUser: UserProfile = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  avatar_url: "",
};

const renderWithProviders = (
  ui: React.ReactElement,
  { user, loading = false }: { user: UserProfile | null; loading?: boolean } = {
    user: mockUser,
    loading: false,
  },
) => {
  return render(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          user,
          loading,
          setUser: () => {},
          refreshUser: async () => {},
        }}
      >
        {ui}
      </AuthContext.Provider>
    </MemoryRouter>,
  );
};

describe("PlaylistList", () => {
  beforeEach(() => {
    resetHandlerState();
  });

  it("should show a message to log in if the user is not authenticated", () => {
    renderWithProviders(<PlaylistList />, { user: null });
    expect(
      screen.getByText("Please log in to see your playlists."),
    ).toBeInTheDocument();
  });

  it("should render a loading state initially", () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/", async () => {
        await delay("infinite");
        return HttpResponse.json([]);
      }),
    );
    renderWithProviders(<PlaylistList />);
    expect(screen.getByText("Loading playlists...")).toBeInTheDocument();
  });

  it("should render an error message if fetching playlists fails", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );
    renderWithProviders(<PlaylistList />);
    expect(
      await screen.findByText("Error: Failed to fetch playlists."),
    ).toBeInTheDocument();
  });

  it("should render a list of playlists", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/", () => {
        return HttpResponse.json(mockPlaylists);
      }),
    );
    renderWithProviders(<PlaylistList />);

    expect(await screen.findByText("Rock Classics")).toBeInTheDocument();
    expect(screen.getByText("The best rock songs")).toBeInTheDocument();
    expect(screen.getByText("Jazz Vibes")).toBeInTheDocument();
    expect(screen.getByText("Smooth jazz for relaxing")).toBeInTheDocument();
  });

  it("should open the 'Create New Playlist' modal when the add button is clicked", async () => {
    renderWithProviders(<PlaylistList />);

    // Wait for loading to finish; default handler returns "Initial Playlist"
    await screen.findByText("Initial Playlist");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Click the add button
    fireEvent.click(screen.getByRole("button", { name: /add playlist/i }));

    // Modal should now be visible
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    expect(screen.getByText("Create a New Playlist")).toBeInTheDocument();
  });
});
