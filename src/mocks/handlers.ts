import { http, HttpResponse } from "msw";
import type { Playlist } from "@/features/playlists/types";
import type { UserProfile } from "@/features/auth/types";

const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 1,
    title: "Initial Playlist",
    description: "A default playlist.",
    is_public: true,
    owner: 1,
    songs: [],
  },
];

let playlists: Playlist[] = [...INITIAL_PLAYLISTS];

/**
 * Resets in-memory handler state back to the initial fixture.
 * Call this in a beforeEach when a test file mutates handler state.
 */
export const resetHandlerState = () => {
  playlists = INITIAL_PLAYLISTS.map((p) => ({ ...p, songs: [] }));
};

const mockUser: UserProfile = {
  id: 1,
  username: "testuser",
  email: "test@test.com",
};

export const handlers = [
  // Get User
  http.get("http://localhost:8000/api/auth/user/", () => {
    return HttpResponse.json(mockUser);
  }),

  // List Playlists
  http.get("http://localhost:8000/api/playlists/", () => {
    return HttpResponse.json(playlists);
  }),

  // Create Playlist
  http.post("http://localhost:8000/api/playlists/", async ({ request }) => {
    const newPlaylistData = (await request.json()) as Partial<Playlist>;
    const newPlaylist: Playlist = {
      id: playlists.length + 1,
      title: newPlaylistData.title || "New Playlist",
      description: newPlaylistData.description || "",
      is_public: newPlaylistData.is_public || false,
      owner: 1, // Assuming a logged-in user with ID 1
      songs: [],
    };
    playlists.push(newPlaylist);
    return HttpResponse.json(newPlaylist, { status: 201 });
  }),

  // Get single Playlist
  http.get("http://localhost:8000/api/playlists/:id/", ({ params }) => {
    const { id } = params;
    const playlistId = parseInt(id as string, 10);
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist) {
      return HttpResponse.json(playlist);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  // Update Playlist (PATCH)
  http.patch(
    "http://localhost:8000/api/playlists/:id/",
    async ({ request, params }) => {
      const { id } = params;
      const playlistId = parseInt(id as string, 10);
      const updates = (await request.json()) as Partial<Playlist>;
      const index = playlists.findIndex((p) => p.id === playlistId);
      if (index !== -1) {
        playlists[index] = { ...playlists[index], ...updates };
        return HttpResponse.json(playlists[index]);
      }
      return new HttpResponse(null, { status: 404 });
    },
  ),

  // Delete Playlist
  http.delete("http://localhost:8000/api/playlists/:id/", ({ params }) => {
    const { id } = params;
    const playlistId = parseInt(id as string, 10);
    const initialLength = playlists.length;
    playlists = playlists.filter((p) => p.id !== playlistId);
    if (playlists.length < initialLength) {
      return new HttpResponse(null, { status: 204 });
    }
    return new HttpResponse(null, { status: 404 });
  }),

  // Add Song to Playlist
  http.post(
    "http://localhost:8000/api/playlists/:id/add_song/",
    async ({ request, params }) => {
      const { id } = params;
      const playlistId = parseInt(id as string, 10);
      const { song_id } = (await request.json()) as { song_id: number };
      const playlist = playlists.find((p) => p.id === playlistId);

      if (playlist) {
        const newSong = {
          id: song_id,
          order: playlist.songs.length + 1,
          added_at: new Date().toISOString(),
          song: {
            id: song_id,
            title: `Song ${song_id}`,
            duration: 180,
            file_url: `http://example.com/song${song_id}.mp3`,
            artist: "Mock Artist",
            album: "Mock Album",
            genre: "Mock Genre",
            release_date: "2023-01-01",
            cover_image_url: null,
            play_count: 0,
          },
        };
        playlist.songs.push(newSong);
        return HttpResponse.json(playlist);
      }
      return new HttpResponse(null, { status: 404 });
    },
  ),

  // Remove Song from Playlist
  http.delete(
    "http://localhost:8000/api/playlists/:id/delete_song/",
    async ({ request, params }) => {
      const { id } = params;
      const playlistId = parseInt(id as string, 10);
      const { song_id } = (await request.json()) as { song_id: number };
      const playlist = playlists.find((p) => p.id === playlistId);

      if (playlist) {
        const initialLength = playlist.songs.length;
        playlist.songs = playlist.songs.filter((s) => s.song.id !== song_id);
        if (playlist.songs.length < initialLength) {
          return HttpResponse.json(playlist);
        }
      }
      return new HttpResponse(null, { status: 404 });
    },
  ),
];
