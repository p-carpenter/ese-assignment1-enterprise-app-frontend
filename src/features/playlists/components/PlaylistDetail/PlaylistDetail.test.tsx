import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlaylistDetail } from "./PlaylistDetail";
import { AuthContext } from "@/shared/context/AuthContext";
import { type UserProfile } from "@/features/auth/types";
import { type Song } from "@/features/songs/types";
import { type Playlist } from "@/features/playlists/types";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { resetHandlerState } from "@/mocks/handlers";
import { SongList } from "@/features/songs/components/SongList/SongList";
import type { ComponentProps } from "react";

const mockPlaySong = vi.fn();

vi.mock("@/shared/context/PlayerContext", () => ({
  usePlayer: vi.fn(() => ({
    playSong: mockPlaySong,
  })),
}));

vi.mock("@/features/songs/components/SongList/SongList", () => ({
  SongList: vi.fn(),
}));

vi.mock(
  "@/features/playlists/components/AddSongToPlaylistModal/AddSongToPlaylistModal",
  () => ({
    AddSongToPlaylistModal: ({
      isOpen,
      onClose,
    }: {
      isOpen: boolean;
      onClose: () => void;
    }) =>
      isOpen ? (
        <div role="dialog" aria-label="Add songs modal">
          <button onClick={onClose}>Close Modal</button>
        </div>
      ) : null,
  }),
);

vi.mock("../PlaylistHero/PlaylistHero", () => ({
  PlaylistHero: ({
    onAddSongClick,
    onPlayClick,
    canAddSongs,
  }: {
    onAddSongClick: () => void;
    onPlayClick: () => void;
    canAddSongs: boolean;
  }) => (
    <div data-testid="playlist-hero">
      <button onClick={onPlayClick}>Play Playlist</button>
      {canAddSongs && <button onClick={onAddSongClick}>Open Add Modal</button>}
    </div>
  ),
}));

const mockOwner: UserProfile = {
  id: 1,
  username: "owner",
  email: "owner@test.com",
};
const mockGuestUser: UserProfile = {
  id: 2,
  username: "guest",
  email: "guest@test.com",
};

const mockSong: Song = {
  id: 10,
  title: "Song Alpha",
  artist: "Artist A",
  file_url: "url",
  duration: 180,
  cover_art_url: "https://placehold.co/220",
  uploaded_at: "2024-01-01",
};

const makePlaylist = (overrides: Partial<Playlist> = {}): Playlist => ({
  id: 1,
  title: "Owner's Playlist",
  description: "A playlist for testing",
  is_public: true,
  is_collaborative: false,
  cover_art_url: "https://placehold.co/220",
  owner: { id: 1, username: "owner" },
  songs: [],
  ...overrides,
});

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const authValue = (user: UserProfile | null) => ({
  user,
  loading: false,
  setUser: () => {},
  refreshUser: async () => {},
  login: async () => {},
  logout: async () => {},
});

const renderDetail = (
  playlistId: number | string = 1,
  user: UserProfile | null = mockOwner,
) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue(user)}>
        <MemoryRouter initialEntries={[`/playlists/${playlistId}`]}>
          <Routes>
            <Route path="/playlists/:playlistId" element={<PlaylistDetail />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
};

const MockSongList = ({
  songs,
  getDropdownItems,
  getAvatarUser,
}: ComponentProps<typeof SongList>) => (
  <ul data-testid="song-list">
    {songs.map((s) => {
      const items = getDropdownItems?.(s) ?? [];
      return (
        <li key={s.id} data-testid={`song-item-${s.id}`}>
          {s.title}
          <span data-testid={`avatar-${s.id}`}>
            {getAvatarUser?.(s)?.username ?? "none"}
          </span>
          {items.map((item) => (
            <button key={item.label} onClick={item.onSelect}>
              {item.label}
            </button>
          ))}
        </li>
      );
    })}
  </ul>
);

describe("PlaylistDetail", () => {
  beforeEach(() => {
    resetHandlerState();
    vi.clearAllMocks();
    vi.mocked(SongList).mockImplementation(MockSongList as typeof SongList);
  });

  describe("Render & Loading States", () => {
    it("shows a loading indicator while fetching the playlist", () => {
      server.use(
        http.get("http://localhost:8000/api/playlists/1/", async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json(makePlaylist());
        }),
      );

      renderDetail(1, mockOwner);
      expect(screen.getByText(/loading playlist/i)).toBeInTheDocument();
    });

    it("displays an empty state message when the playlist has no songs", async () => {
      server.use(
        http.get("http://localhost:8000/api/playlists/1/", () =>
          HttpResponse.json(makePlaylist({ songs: [] })),
        ),
      );

      renderDetail(1, mockOwner);
      expect(
        await screen.findByText(/no songs in this playlist yet/i),
      ).toBeInTheDocument();
    });

    it("renders the song list when songs are present", async () => {
      server.use(
        http.get("http://localhost:8000/api/playlists/1/", () =>
          HttpResponse.json(
            makePlaylist({
              songs: [{ id: 1, order: 1, added_at: "", song: mockSong }],
            }),
          ),
        ),
      );

      renderDetail(1, mockOwner);
      expect(await screen.findByText("Song Alpha")).toBeInTheDocument();
    });
  });

  describe("Access Control & Permissions", () => {
    it("renders add song actions for the playlist owner", async () => {
      server.use(
        http.get("http://localhost:8000/api/playlists/1/", () =>
          HttpResponse.json(makePlaylist({ is_collaborative: false })),
        ),
      );

      renderDetail(1, mockOwner);
      expect(
        await screen.findByRole("button", { name: "Open Add Modal" }),
      ).toBeInTheDocument();
    });

    it("hides add song actions from non-owners on non-collaborative playlists", async () => {
      server.use(
        http.get("http://localhost:8000/api/playlists/1/", () =>
          HttpResponse.json(makePlaylist({ is_collaborative: false })),
        ),
      );

      renderDetail(1, mockGuestUser);
      await screen.findByTestId("playlist-hero");
      expect(
        screen.queryByRole("button", { name: "Open Add Modal" }),
      ).not.toBeInTheDocument();
    });

    it("renders add song actions for authenticated users on collaborative playlists", async () => {
      server.use(
        http.get("http://localhost:8000/api/playlists/1/", () =>
          HttpResponse.json(makePlaylist({ is_collaborative: true })),
        ),
      );

      renderDetail(1, mockGuestUser);
      expect(
        await screen.findByRole("button", { name: "Open Add Modal" }),
      ).toBeInTheDocument();
    });

    it("hides add song actions from unauthenticated users on collaborative playlists", async () => {
      server.use(
        http.get("http://localhost:8000/api/playlists/1/", () =>
          HttpResponse.json(makePlaylist({ is_collaborative: true })),
        ),
      );

      renderDetail(1, null);
      await screen.findByTestId("playlist-hero");
      expect(
        screen.queryByRole("button", { name: "Open Add Modal" }),
      ).not.toBeInTheDocument();
    });

    it("maps unique contributors and passes them down for collaborative playlists", async () => {
      const mockContributor1 = {
        id: 99,
        username: "contributor1",
        email: "c1@test.com",
      };
      const mockContributor2 = {
        id: 100,
        username: "contributor2",
        email: "c2@test.com",
      };

      server.use(
        http.get("http://localhost:8000/api/playlists/1/", () =>
          HttpResponse.json(
            makePlaylist({
              is_collaborative: true,
              songs: [
                {
                  id: 1,
                  order: 1,
                  added_at: "",
                  song: mockSong,
                  added_by: mockContributor1,
                },
                {
                  id: 2,
                  order: 2,
                  added_at: "",
                  song: { ...mockSong, id: 11 },
                  added_by: mockContributor2,
                },
                {
                  id: 3,
                  order: 3,
                  added_at: "",
                  song: { ...mockSong, id: 12 },
                  added_by: mockContributor1,
                },
              ],
            }),
          ),
        ),
      );

      renderDetail(1, mockOwner);

      const contributor1 = await screen.findAllByText("contributor1");
      const contributor2 = await screen.findAllByText("contributor2");

      expect(contributor1[0]).toBeInTheDocument();
      expect(contributor2[0]).toBeInTheDocument();

      // Verify the count of contributor avatars.
      const avatars = screen.getAllByTestId(/^avatar-/);
      expect(avatars).toHaveLength(3);
    });
  });

  describe("User Interactions", () => {
    it("triggers playSong with the first song and full list when Play is clicked", async () => {
      const songTwo = { ...mockSong, id: 11, title: "Song Beta" };
      server.use(
        http.get("http://localhost:8000/api/playlists/1/", () =>
          HttpResponse.json(
            makePlaylist({
              songs: [
                { id: 1, order: 1, added_at: "", song: mockSong },
                { id: 2, order: 2, added_at: "", song: songTwo },
              ],
            }),
          ),
        ),
      );

      renderDetail(1, mockOwner);

      const playButton = await screen.findByRole("button", {
        name: "Play Playlist",
      });
      fireEvent.click(playButton);

      expect(mockPlaySong).toHaveBeenCalledTimes(1);
      expect(mockPlaySong).toHaveBeenCalledWith(mockSong, [mockSong, songTwo]);
    });

    it("toggles the Add Song modal open and closed", async () => {
      server.use(
        http.get("http://localhost:8000/api/playlists/1/", () =>
          HttpResponse.json(makePlaylist()),
        ),
      );

      renderDetail(1, mockOwner);

      const openButton = await screen.findByRole("button", {
        name: "Open Add Modal",
      });
      fireEvent.click(openButton);
      expect(
        screen.getByRole("dialog", { name: "Add songs modal" }),
      ).toBeInTheDocument();

      const closeButton = screen.getByRole("button", { name: "Close Modal" });
      fireEvent.click(closeButton);
      expect(
        screen.queryByRole("dialog", { name: "Add songs modal" }),
      ).not.toBeInTheDocument();
    });

    it("calls the remove-song endpoint after the dropdown action fires", async () => {
      let removeSongCalled = false;
      server.use(
        http.get("http://localhost:8000/api/playlists/1/", () =>
          HttpResponse.json(
            makePlaylist({
              songs: [{ id: 1, order: 1, added_at: "", song: mockSong }],
            }),
          ),
        ),
        http.delete(
          "http://localhost:8000/api/playlists/1/delete_song/",
          () => {
            removeSongCalled = true;
            return HttpResponse.json(makePlaylist());
          },
        ),
      );

      renderDetail(1, mockOwner);
      await screen.findByText("Song Alpha");

      fireEvent.click(
        screen.getByRole("button", { name: /remove from playlist/i }),
      );

      await waitFor(() => {
        expect(removeSongCalled).toBe(true);
      });
    });
  });

  describe("Error Handling & Edge Cases", () => {
    it("displays an error message if the playlist API returns a 404/500", async () => {
      server.use(
        http.get("http://localhost:8000/api/playlists/1/", () => {
          return HttpResponse.error();
        }),
      );

      renderDetail(1, mockOwner);
      expect(
        await screen.findByText(
          /playlist not found or you don't have permission/i,
        ),
      ).toBeInTheDocument();
    });

    it("gracefully handles invalid playlist IDs in the URL", async () => {
      // Testing the fallback to '0' and subsequent failure/empty state.
      renderDetail("invalid_id", mockOwner);
      expect(
        await screen.findByText(
          /playlist not found or you don't have permission/i,
        ),
      ).toBeInTheDocument();
    });

    it("displays an inline error alert if removing a song fails", async () => {
      server.use(
        http.get("http://localhost:8000/api/playlists/1/", () =>
          HttpResponse.json(
            makePlaylist({
              songs: [{ id: 1, order: 1, added_at: "", song: mockSong }],
            }),
          ),
        ),
        http.delete(
          "http://localhost:8000/api/playlists/1/delete_song/",
          () => {
            return new HttpResponse(null, {
              status: 500,
              statusText: "Server Error",
            });
          },
        ),
      );

      renderDetail(1, mockOwner);
      await screen.findByText("Song Alpha");

      fireEvent.click(
        screen.getByRole("button", { name: /remove from playlist/i }),
      );

      expect(await screen.findByText(/Unknown error/i)).toBeInTheDocument();
    });

    it("displays the readable message when the API returns a structured error payload", async () => {
      server.use(
        http.get("http://localhost:8000/api/playlists/1/", () =>
          HttpResponse.json(
            makePlaylist({
              songs: [{ id: 1, order: 1, added_at: "", song: mockSong }],
            }),
          ),
        ),
        // Intercept the DELETE request and return a structured Django error.
        http.delete(
          "http://localhost:8000/api/playlists/1/delete_song/",
          () => {
            return HttpResponse.json(
              { detail: "You do not have permission to remove this song." },
              { status: 403 },
            );
          },
        ),
      );

      renderDetail(1, mockOwner);
      await screen.findByText("Song Alpha");

      // Trigger the mutation.
      fireEvent.click(
        screen.getByRole("button", { name: /remove from playlist/i }),
      );

      expect(
        await screen.findByText(
          "You do not have permission to remove this song.",
        ),
      ).toBeInTheDocument();
    });

    it("displays fallback error message if thrown error is not an Error instance", async () => {
      server.use(
        http.get("http://localhost:8000/api/playlists/1/", () =>
          HttpResponse.json(
            makePlaylist({
              songs: [{ id: 1, order: 1, added_at: "", song: mockSong }],
            }),
          ),
        ),
        http.delete(
          "http://localhost:8000/api/playlists/1/delete_song/",
          () => {
            // Simulate a thrown string instead of Error object.
            throw "something bad happened";
          },
        ),
      );

      renderDetail(1, mockOwner);
      await screen.findByText("Song Alpha");

      fireEvent.click(
        screen.getByRole("button", { name: /remove from playlist/i }),
      );

      expect(
        await screen.findByText(/unexpected error|remove/i),
      ).toBeInTheDocument();
    });
  });
});
