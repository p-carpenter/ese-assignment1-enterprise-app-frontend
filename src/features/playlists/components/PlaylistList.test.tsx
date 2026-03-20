import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlaylistList } from "./PlaylistList";
import { AuthContext } from "@/shared/context/AuthContext";
import { MemoryRouter } from "react-router-dom";
import * as router from "react-router-dom";
import type { Playlist } from "../types";
import { type UserProfile } from "@/features/auth/types";
import { server } from "@/mocks/server";
import { http, HttpResponse, delay } from "msw";
import { resetHandlerState } from "@/mocks/handlers";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

// Mock react-router-dom to spy on useNavigate.
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const mockPlaylists: Playlist[] = [
  {
    id: 1,
    title: "Rock Classics",
    description: "The best rock songs",
    songs: [], // Tests plural "0 songs"
    is_public: false,
    is_collaborative: false,
    cover_art_url: null, // Tests fallback UI
    owner: { id: 1, username: "testuser" },
  },
  {
    id: 2,
    title: "Jazz Vibes",
    description: "Smooth jazz for relaxing",
    songs: [
      {
        id: 101,
        added_at: "2023-01-01T00:00:00Z",
        order: 1,
        song: {
          id: 101,
          title: "Take Five",
          duration: 320,
          artist: "Dave Brubeck",
          file_url: "https://example.com/take-five.mp3",
          cover_art_url: "https://example.com/take-five.jpg",
          uploaded_at: "2023-01-01T00:00:00Z",
        },
      },
    ],
    is_public: true, // Tests Earth icon badge
    is_collaborative: true, // Tests People icon badge
    cover_art_url: "https://example.com/jazz.jpg", // Tests image rendering
    owner: { id: 1, username: "testuser" },
  },
];

const mockUser: UserProfile = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  avatar_url: "",
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

interface ProviderOptions {
  user?: UserProfile | null;
  loading?: boolean;
  logoutMock?: () => Promise<void>;
}

const renderWithProviders = (
  ui: React.ReactElement,
  {
    user = mockUser,
    loading = false,
    logoutMock = vi.fn(() => Promise.resolve()),
  }: ProviderOptions = {},
) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            user,
            loading,
            setUser: () => {},
            refreshUser: () => Promise.resolve(),
            login: () => Promise.resolve(),
            logout: logoutMock,
          }}
        >
          {ui}
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("PlaylistList", () => {
  beforeEach(() => {
    resetHandlerState();
    vi.clearAllMocks();
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
      await screen.findByText("Failed to fetch playlists."),
    ).toBeInTheDocument();

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("should render an empty state when the user has no playlists", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/", () => {
        return HttpResponse.json([]);
      }),
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
      http.get("http://localhost:8000/api/playlists/", () => {
        return HttpResponse.json(mockPlaylists);
      }),
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

  it("should open the 'Create New Playlist' modal when the add button is clicked", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/", () => {
        return HttpResponse.json(mockPlaylists);
      }),
    );
    renderWithProviders(<PlaylistList />);

    await screen.findByText("Rock Classics");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /create playlist/i }));

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    expect(screen.getByText("Create a New Playlist")).toBeInTheDocument();
  });

  it("should open the modal when clicking the button in the empty state", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/", () => {
        return HttpResponse.json([]);
      }),
    );
    renderWithProviders(<PlaylistList />);

    await screen.findByText("You don't have any playlists yet.");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /create your first playlist/i }),
    );

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
  });

  it("should close the modal when the onClose action is triggered inside the modal", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/", () => {
        return HttpResponse.json(mockPlaylists);
      }),
    );
    renderWithProviders(<PlaylistList />);

    await screen.findByText("Rock Classics");

    fireEvent.click(screen.getByRole("button", { name: /create playlist/i }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    const closeButton = screen.getByRole("button", { name: /cancel|close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("should have no accessibility violations", async () => {
    const { container } = renderWithProviders(<PlaylistList />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe("Auth Footer Rendering & Actions", () => {
    let navigateMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      navigateMock = vi.fn();
      vi.spyOn(router, "useNavigate").mockReturnValue(
        navigateMock as unknown as router.NavigateFunction,
      );

      server.use(
        http.get("http://localhost:8000/api/playlists/", () => {
          return HttpResponse.json(mockPlaylists);
        }),
      );
    });

    it("renders the user avatar image if avatar_url is provided", async () => {
      const userWithAvatar = {
        ...mockUser,
        avatar_url: "https://example.com/me.jpg",
      };
      renderWithProviders(<PlaylistList />, { user: userWithAvatar });

      await screen.findByText("Rock Classics");

      const avatar = screen.getByAltText("Profile");
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute("src", "https://example.com/me.jpg");
    });

    it("renders the user's initial if avatar_url is missing", async () => {
      const userWithoutAvatar = {
        ...mockUser,
        username: "bob",
        avatar_url: "",
      };
      renderWithProviders(<PlaylistList />, { user: userWithoutAvatar });

      await screen.findByText("Rock Classics");

      expect(screen.getByText("B")).toBeInTheDocument();
      expect(screen.queryByAltText("Profile")).not.toBeInTheDocument();
    });

    it("navigates to the profile page when the avatar button is clicked", async () => {
      renderWithProviders(<PlaylistList />);
      await screen.findByText("Rock Classics");

      const profileButton = screen.getByTitle("View Profile");
      fireEvent.click(profileButton);

      expect(navigateMock).toHaveBeenCalledWith("/profile");
    });

    it("calls logout and navigates to login when Log Out is clicked", async () => {
      const logoutMock = vi.fn(() => Promise.resolve());
      renderWithProviders(<PlaylistList />, { logoutMock });

      await screen.findByText("Rock Classics");

      const logoutButton = screen.getByRole("button", { name: "Log Out" });
      fireEvent.click(logoutButton);

      expect(logoutMock).toHaveBeenCalled();

      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith("/login");
      });
    });

    it("logs an error and does not navigate if logout fails", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const failingLogoutMock = vi.fn(() =>
        Promise.reject(new Error("Network Error")),
      );

      renderWithProviders(<PlaylistList />, { logoutMock: failingLogoutMock });

      await screen.findByText("Rock Classics");

      const logoutButton = screen.getByRole("button", { name: "Log Out" });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(failingLogoutMock).toHaveBeenCalled();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Logout failed:",
        expect.any(Error),
      );

      expect(navigateMock).not.toHaveBeenCalledWith("/login");

      consoleSpy.mockRestore();
    });
  });
});
