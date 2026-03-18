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

// Fixtures
const mockOwner: UserProfile = {
  id: 1,
  username: "owner",
  email: "owner@test.com",
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

const renderDetail = (playlistId = 1, user: UserProfile | null = mockOwner) => {
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

// Typesikker mock for SongList
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

  // Legg til resten av MSW-testene dine her. F.eks:
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
      http.delete("http://localhost:8000/api/playlists/1/delete_song/", () => {
        removeSongCalled = true;
        return HttpResponse.json(makePlaylist());
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
