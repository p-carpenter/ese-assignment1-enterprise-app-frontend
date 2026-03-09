import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlaylistDetail } from "./PlaylistDetail";
import { AuthContext } from "@/shared/context/AuthContext";
import { type UserProfile } from "@/features/auth/types";
import { type Song } from "@/features/songs/types";
import { type DropdownItem } from "@/features/songs/components/SongManagementDropdown/SongManagementDropdown";
import { type Playlist } from "@/features/playlists/types";
import { server } from "@/mocks/server";
import { http, HttpResponse, delay } from "msw";
import { resetHandlerState } from "@/mocks/handlers";
import { SongList } from "@/features/songs/components/SongList/SongList";

// ─── Mock complex child components ────────────────────────────────────────────

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

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const mockOwner: UserProfile = {
  id: 1,
  username: "owner",
  email: "owner@test.com",
};

const mockOtherUser: UserProfile = {
  id: 99,
  username: "stranger",
  email: "stranger@test.com",
};

const mockSong: Song = {
  id: 10,
  title: "Song Alpha",
  artist: "Artist A",
  file_url: "http://example.com/alpha.mp3",
  duration: 180,
  uploaded_at: "2024-01-01T00:00:00Z",
};

const makePlaylist = (overrides: Partial<Playlist> = {}): Playlist => ({
  id: 1,
  title: "Owner's Playlist",
  description: "A playlist for testing",
  is_public: true,
  is_collaborative: false,
  cover_art_url: null,
  owner: { id: 1, username: "owner" },
  songs: [],
  ...overrides,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const authValue = (user: UserProfile | null) => ({
  user,
  loading: false,
  setUser: () => {},
  refreshUser: () => Promise.resolve(),
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
});

const renderDetail = (playlistId = 1, user: UserProfile | null = mockOwner) => {
  const queryClient = createQueryClient();
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authValue(user)}>
          <MemoryRouter initialEntries={[`/playlists/${playlistId}`]}>
            <Routes>
              <Route
                path="/playlists/:playlistId"
                element={<PlaylistDetail />}
              />
              <Route path="/" element={<div>Home Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    ),
  };
};

// Default SongList implementation used by most tests
const defaultSongListImpl = ({ songs }: { songs: Song[] }) => (
  <ul data-testid="song-list">
    {songs.map((s) => (
      <li key={s.id} data-testid={`song-item-${s.id}`}>
        {s.title}
      </li>
    ))}
  </ul>
);

describe("PlaylistDetail", () => {
  beforeEach(() => {
    resetHandlerState();
    vi.clearAllMocks();
    vi.mocked(SongList).mockImplementation(
      defaultSongListImpl as typeof SongList,
    );
  });

  // ─── Loading state ────────────────────────────────────────────────────────

  it("shows a loading message while the playlist is being fetched", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/1/", async () => {
        await delay("infinite");
        return HttpResponse.json(makePlaylist());
      }),
    );

    renderDetail();
    expect(screen.getByText(/loading playlist/i)).toBeInTheDocument();
  });

  // ─── Error / not found ────────────────────────────────────────────────────

  it("shows an error message when the playlist cannot be found (404)", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );

    renderDetail();

    expect(
      await screen.findByText(
        /playlist not found or you don't have permission/i,
      ),
    ).toBeInTheDocument();
  });

  it("shows an error message on a 500 server error", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    renderDetail();

    expect(
      await screen.findByText(
        /playlist not found or you don't have permission/i,
      ),
    ).toBeInTheDocument();
  });

  // ─── Successful render ────────────────────────────────────────────────────

  it("renders the playlist title once loaded", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return HttpResponse.json(makePlaylist({ title: "Morning Vibes" }));
      }),
    );

    renderDetail();
    expect(await screen.findByText("Morning Vibes")).toBeInTheDocument();
  });

  it("renders the 'Songs' section heading", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return HttpResponse.json(makePlaylist());
      }),
    );

    renderDetail();
    expect(
      await screen.findByRole("heading", { name: "Songs" }),
    ).toBeInTheDocument();
  });

  it("shows 'No songs in this playlist yet' when songs array is empty", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return HttpResponse.json(makePlaylist({ songs: [] }));
      }),
    );

    renderDetail();
    expect(
      await screen.findByText(/no songs in this playlist yet/i),
    ).toBeInTheDocument();
  });

  it("renders the SongList when there are songs", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return HttpResponse.json(
          makePlaylist({
            songs: [
              {
                id: 1,
                order: 1,
                added_at: "2024-01-01T00:00:00Z",
                song: mockSong,
              },
            ],
          }),
        );
      }),
    );

    renderDetail();
    expect(await screen.findByTestId("song-list")).toBeInTheDocument();
    expect(screen.getByText("Song Alpha")).toBeInTheDocument();
  });

  it("renders all songs from the playlist", async () => {
    const songs = [
      { ...mockSong, id: 10, title: "Song Alpha" },
      { ...mockSong, id: 11, title: "Song Beta" },
      { ...mockSong, id: 12, title: "Song Gamma" },
    ];

    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return HttpResponse.json(
          makePlaylist({
            songs: songs.map((s, i) => ({
              id: i + 1,
              order: i + 1,
              added_at: "2024-01-01T00:00:00Z",
              song: s,
            })),
          }),
        );
      }),
    );

    renderDetail();
    await screen.findByText("Song Alpha");
    expect(screen.getByText("Song Beta")).toBeInTheDocument();
    expect(screen.getByText("Song Gamma")).toBeInTheDocument();
  });

  // ─── Owner vs non-owner ───────────────────────────────────────────────────

  it("shows Edit and Delete controls when the logged-in user is the owner", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return HttpResponse.json(makePlaylist());
      }),
    );

    renderDetail(1, mockOwner); // owner.id === user.id === 1
    await screen.findByText("Owner's Playlist");

    expect(
      screen.getByRole("button", { name: /edit playlist/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete playlist/i }),
    ).toBeInTheDocument();
  });

  it("hides Edit and Delete controls for a non-owner viewer", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return HttpResponse.json(makePlaylist());
      }),
    );

    renderDetail(1, mockOtherUser); // owner.id=1, user.id=99
    await screen.findByText("Owner's Playlist");

    expect(
      screen.queryByRole("button", { name: /edit playlist/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /delete playlist/i }),
    ).not.toBeInTheDocument();
  });

  // ─── Add songs (canAddSongs) ──────────────────────────────────────────────

  it("shows 'Add songs' button for the owner", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return HttpResponse.json(makePlaylist());
      }),
    );

    renderDetail(1, mockOwner);
    await screen.findByText("Owner's Playlist");

    expect(
      screen.getByRole("button", { name: /add songs/i }),
    ).toBeInTheDocument();
  });

  it("shows 'Add songs' button for a non-owner on a collaborative playlist", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return HttpResponse.json(makePlaylist({ is_collaborative: true }));
      }),
    );

    renderDetail(1, mockOtherUser);
    await screen.findByText("Owner's Playlist");

    expect(
      screen.getByRole("button", { name: /add songs/i }),
    ).toBeInTheDocument();
  });

  it("hides 'Add songs' button for a non-owner on a non-collaborative playlist", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return HttpResponse.json(makePlaylist({ is_collaborative: false }));
      }),
    );

    renderDetail(1, mockOtherUser);
    await screen.findByText("Owner's Playlist");

    expect(
      screen.queryByRole("button", { name: /add songs/i }),
    ).not.toBeInTheDocument();
  });

  // ─── Add Song modal ───────────────────────────────────────────────────────

  it("opens the AddSong modal when 'Add songs' is clicked", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return HttpResponse.json(makePlaylist());
      }),
    );

    renderDetail(1, mockOwner);
    await screen.findByText("Owner's Playlist");

    expect(
      screen.queryByRole("dialog", { name: /add songs modal/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add songs/i }));

    expect(
      screen.getByRole("dialog", { name: /add songs modal/i }),
    ).toBeInTheDocument();
  });

  it("closes the AddSong modal when its onClose is called", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return HttpResponse.json(makePlaylist());
      }),
    );

    renderDetail(1, mockOwner);
    await screen.findByText("Owner's Playlist");

    fireEvent.click(screen.getByRole("button", { name: /add songs/i }));
    expect(
      screen.getByRole("dialog", { name: /add songs modal/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close modal/i }));
    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: /add songs modal/i }),
      ).not.toBeInTheDocument();
    });
  });

  // ─── Number of songs in PlaylistHero ─────────────────────────────────────

  it("passes the correct songs count to PlaylistHero", async () => {
    const songs = [
      { ...mockSong, id: 10 },
      { ...mockSong, id: 11, title: "Song B" },
    ];

    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return HttpResponse.json(
          makePlaylist({
            songs: songs.map((s, i) => ({
              id: i + 1,
              order: i + 1,
              added_at: "2024-01-01T00:00:00Z",
              song: s,
            })),
          }),
        );
      }),
    );

    renderDetail();
    // PlaylistHero renders "2 songs"
    expect(await screen.findByText(/2 songs/)).toBeInTheDocument();
  });

  it("shows '1 song' (singular) when the playlist has exactly one song", async () => {
    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return HttpResponse.json(
          makePlaylist({
            songs: [
              {
                id: 1,
                order: 1,
                added_at: "2024-01-01T00:00:00Z",
                song: mockSong,
              },
            ],
          }),
        );
      }),
    );

    renderDetail();
    expect(await screen.findByText(/1 song\b/)).toBeInTheDocument();
  });

  // ─── Contributors (collaborative) ────────────────────────────────────────

  it("passes deduplicated contributors to PlaylistHero for a collaborative playlist", async () => {
    const contributor = { id: 55, username: "contrib" };
    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return HttpResponse.json(
          makePlaylist({
            is_collaborative: true,
            songs: [
              {
                id: 1,
                order: 1,
                added_at: "2024-01-01T00:00:00Z",
                added_by: contributor,
                song: mockSong,
              },
              {
                id: 2,
                order: 2,
                added_at: "2024-01-01T00:00:00Z",
                added_by: contributor, // same person twice
                song: { ...mockSong, id: 11, title: "Song B" },
              },
            ],
          }),
        );
      }),
    );

    renderDetail(1, mockOtherUser);

    // PlaylistHero shows "Contributors" label + username title
    expect(await screen.findByTitle("contrib")).toBeInTheDocument();
    // Only one contributor chip (deduplicated)
    expect(screen.getAllByTitle("contrib")).toHaveLength(1);
  });

  it("does not show contributors for a non-collaborative playlist", async () => {
    const contributor = { id: 55, username: "contrib" };
    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return HttpResponse.json(
          makePlaylist({
            is_collaborative: false,
            songs: [
              {
                id: 1,
                order: 1,
                added_at: "2024-01-01T00:00:00Z",
                added_by: contributor,
                song: mockSong,
              },
            ],
          }),
        );
      }),
    );

    renderDetail();
    await screen.findByText("Owner's Playlist");

    expect(screen.queryByText("Contributors")).not.toBeInTheDocument();
  });

  // ─── Invalid playlist ID ──────────────────────────────────────────────────

  it("shows an error when playlistId is 0 (query is disabled, playlist undefined)", () => {
    // parsedId = 0 → enabled = false → query never runs → playlist is undefined
    // The component treats an undefined playlist as an error state.
    render(
      <QueryClientProvider client={createQueryClient()}>
        <AuthContext.Provider value={authValue(mockOwner)}>
          <MemoryRouter initialEntries={["/playlists/0"]}>
            <Routes>
              <Route
                path="/playlists/:playlistId"
                element={<PlaylistDetail />}
              />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>,
    );

    // With enabled=false, isLoading stays false and playlist is undefined → error view
    expect(
      screen.getByText(/playlist not found or you don't have permission/i),
    ).toBeInTheDocument();
  });

  // ─── Remove song mutation ──────────────────────────────────────────────────

  it("calls the remove-song endpoint after the dropdown action fires", async () => {
    let removeSongCalled = false;
    server.use(
      http.delete("http://localhost:8000/api/playlists/1/delete_song/", () => {
        removeSongCalled = true;
        return HttpResponse.json(makePlaylist());
      }),
    );

    // Override SongList to expose the dropdown items as buttons for this test
    vi.mocked(SongList).mockImplementationOnce((({
      songs,
      getDropdownItems,
    }: {
      songs: Song[];
      getDropdownItems?: (song: Song) => DropdownItem[];
    }) => (
      <ul data-testid="song-list">
        {songs.map((s) => {
          const items = getDropdownItems?.(s) ?? [];
          return (
            <li key={s.id}>
              {s.title}
              {items.map((item) => (
                <button key={item.label} onClick={item.onSelect}>
                  {item.label}
                </button>
              ))}
            </li>
          );
        })}
      </ul>
    )) as typeof SongList);

    server.use(
      http.get("http://localhost:8000/api/playlists/1/", () => {
        return HttpResponse.json(
          makePlaylist({
            songs: [
              {
                id: 1,
                order: 1,
                added_at: "2024-01-01T00:00:00Z",
                song: mockSong,
              },
            ],
          }),
        );
      }),
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
