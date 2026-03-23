import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { PlaylistList } from "./PlaylistList";
import { AuthContext } from "@/shared/context/AuthContext";
import { MemoryRouter } from "react-router-dom";
import { type UserProfile } from "@/features/auth/types";
import { server } from "@/mocks/server";
import { http, HttpResponse, delay } from "msw";
import { resetHandlerState } from "@/mocks/handlers";
import { axe, toHaveNoViolations } from "jest-axe";
import { renderWithQueryClient } from "@/test/render";
import { createPlaylist } from "@/test/factories/playlist";
import { createSong } from "@/test/factories/song";

expect.extend(toHaveNoViolations);

const mockUser: UserProfile = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  avatar_url: "",
};

const mockPlaylists = [
  createPlaylist({
    id: 1,
    title: "Rock Classics",
    description: "The best rock songs",
    songs: [],
    is_public: false,
    is_collaborative: false,
    cover_art_url: null,
  }),
  createPlaylist({
    id: 2,
    title: "Jazz Vibes",
    description: "Smooth jazz for relaxing",
    songs: [
      {
        id: 101,
        added_at: "2023-01-01T00:00:00Z",
        order: 1,
        song: createSong({
          title: "Take Five",
          cover_art_url: "https://example.com/take-five.jpg",
        }),
      },
    ],
    is_public: true,
    is_collaborative: true,
    cover_art_url: "https://example.com/jazz.jpg",
  }),
];

interface RenderOptions {
  user?: UserProfile | null;
  loading?: boolean;
}

const renderWithProviders = (
  ui: React.ReactElement,
  { user = mockUser, loading = false }: RenderOptions = {},
) => {
  return renderWithQueryClient(
    <MemoryRouter>
      <AuthContext.Provider
        value={{
          user,
          loading,
          setUser: () => {},
          refreshUser: () => Promise.resolve(),
          login: () => Promise.resolve(),
          logout: () => Promise.resolve(),
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
    vi.clearAllMocks();
  });

  describe("Loading & Authentication States", () => {
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
  });

  describe("Data Rendering & Error States", () => {
    it("should render an error message if fetching playlists fails", async () => {
      server.use(
        http.get(
          "http://localhost:8000/api/playlists/",
          () => new HttpResponse(null, { status: 500 }),
        ),
      );
      renderWithProviders(<PlaylistList />);
      expect(
        await screen.findByText("Failed to fetch playlists."),
      ).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should render an empty state when the user has no playlists", async () => {
      server.use(
        http.get("http://localhost:8000/api/playlists/", () =>
          HttpResponse.json([]),
        ),
      );
      renderWithProviders(<PlaylistList />);
      expect(
        await screen.findByText("You don't have any playlists yet."),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create your first playlist/i }),
      ).toBeInTheDocument();
    });

    it("should render a list of playlists with correct UI branches", async () => {
      server.use(
        http.get("http://localhost:8000/api/playlists/", () =>
          HttpResponse.json(mockPlaylists),
        ),
      );
      renderWithProviders(<PlaylistList />);

      expect(await screen.findByText("Rock Classics")).toBeInTheDocument();
      expect(screen.getByText("Jazz Vibes")).toBeInTheDocument();

      expect(screen.getByText("0 songs")).toBeInTheDocument();
      expect(screen.getByText("1 song")).toBeInTheDocument();

      const jazzCover = screen.getByAltText("Jazz Vibes");
      expect(jazzCover).toBeInTheDocument();
      expect(jazzCover).toHaveAttribute("src", "https://example.com/jazz.jpg");

      expect(screen.getByTitle("Public")).toBeInTheDocument();
      expect(screen.getByTitle("Collaborative")).toBeInTheDocument();
    });
  });

  describe("User Interactions (Create Modal)", () => {
    it("should open the 'Create New Playlist' modal when the add button is clicked", async () => {
      server.use(
        http.get("http://localhost:8000/api/playlists/", () =>
          HttpResponse.json(mockPlaylists),
        ),
      );
      renderWithProviders(<PlaylistList />);

      await screen.findByText("Rock Classics");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /create playlist/i }));
      await waitFor(() =>
        expect(screen.getByRole("dialog")).toBeInTheDocument(),
      );
      expect(screen.getByText("Create a New Playlist")).toBeInTheDocument();
    });

    it("should open the modal when clicking the button in the empty state", async () => {
      server.use(
        http.get("http://localhost:8000/api/playlists/", () =>
          HttpResponse.json([]),
        ),
      );
      renderWithProviders(<PlaylistList />);

      await screen.findByText("You don't have any playlists yet.");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: /create your first playlist/i }),
      );
      await waitFor(() =>
        expect(screen.getByRole("dialog")).toBeInTheDocument(),
      );
    });

    it("should close the modal when the onClose action is triggered inside the modal", async () => {
      server.use(
        http.get("http://localhost:8000/api/playlists/", () =>
          HttpResponse.json(mockPlaylists),
        ),
      );
      renderWithProviders(<PlaylistList />);

      await screen.findByText("Rock Classics");

      fireEvent.click(screen.getByRole("button", { name: /create playlist/i }));
      await waitFor(() =>
        expect(screen.getByRole("dialog")).toBeInTheDocument(),
      );

      const closeButton = screen.getByRole("button", { name: /cancel|close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have no accessibility violations", async () => {
      const { container } = renderWithProviders(<PlaylistList />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
