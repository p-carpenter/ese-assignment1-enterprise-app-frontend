import { http, HttpResponse } from "msw";
import type { Playlist } from "@/features/playlists/types";
import type { UserProfile } from "@/features/auth/types";
import type { Song } from "@/features/songs/types";
import type { PlayHistoryEntry } from "@/features/player/types";

// Fixtures
const BASE_URL = "http://localhost:8000/api";

const INITIAL_USER: UserProfile = {
  id: 1,
  username: "testuser",
  email: "test@test.com",
};

const INITIAL_SONGS: Song[] = [
  {
    id: 1,
    title: "Skyline",
    artist: "Nova",
    duration: 160,
    file_url: "https://example.com/skyline.mp3",
    cover_art_url: "https://placehold.co/220",
    uploaded_at: "2024-01-01T00:00:00Z",
  },
  {
    id: 2,
    title: "Sunset",
    artist: "Wave",
    duration: 140,
    file_url: "https://example.com/sunset.mp3",
    cover_art_url: "https://placehold.co/220",
    uploaded_at: "2024-01-02T00:00:00Z",
  },
];

const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 1,
    title: "Initial Playlist",
    description: "A default playlist.",
    is_public: true,
    is_collaborative: false,
    cover_art_url: "https://placehold.co/220",
    owner: { id: 1, username: "testuser" },
    songs: [],
  },
];

const INITIAL_HISTORY: PlayHistoryEntry[] = [
  {
    id: 1,
    song: INITIAL_SONGS[0],
    played_at: "2024-01-05T12:00:00Z",
  },
];

// In-memory state for handlers to manipulate during tests.
let currentUser: UserProfile | null = { ...INITIAL_USER };
let songs: Song[] = [...INITIAL_SONGS];
let playlists: Playlist[] = [...INITIAL_PLAYLISTS];
let history: PlayHistoryEntry[] = [...INITIAL_HISTORY];

/**
 * Resets in-memory handler state back to the initial fixtures.
 * Used by tests to restore the mock server state.
 */
export const resetHandlerState = () => {
  currentUser = { ...INITIAL_USER };
  songs = [...INITIAL_SONGS];
  playlists = INITIAL_PLAYLISTS.map((p) => ({ ...p, songs: [] }));
  history = [...INITIAL_HISTORY];
};

// Handlers
/**
 * MSW request handlers used to simulate the backend API in tests and development.
 */
export const handlers = [
  // Auth handlers
  http.post(`${BASE_URL}/auth/login/`, () => {
    return HttpResponse.json({ detail: "Successfully logged in." });
  }),

  http.post(`${BASE_URL}/auth/logout/`, () => {
    return HttpResponse.json(null, { status: 204 });
  }),

  http.get(`${BASE_URL}/auth/user/`, () => {
    if (!currentUser) return new HttpResponse(null, { status: 401 });
    return HttpResponse.json(currentUser);
  }),

  http.patch(`${BASE_URL}/auth/user/`, async ({ request }) => {
    if (!currentUser) return new HttpResponse(null, { status: 401 });
    const updates = (await request.json()) as Partial<UserProfile>;
    currentUser = { ...currentUser, ...updates };
    return HttpResponse.json(currentUser);
  }),

  http.post(`${BASE_URL}/auth/registration/`, () => {
    return HttpResponse.json(
      { detail: "Registration successful." },
      { status: 201 },
    );
  }),

  http.post(`${BASE_URL}/auth/registration/verify-email`, () => {
    return HttpResponse.json({ detail: "Email verified." });
  }),

  http.post(`${BASE_URL}/auth/password/reset/`, () => {
    return HttpResponse.json({
      detail: "Password reset e-mail has been sent.",
    });
  }),

  http.post(`${BASE_URL}/auth/password/reset/confirm/`, () => {
    return HttpResponse.json({
      detail: "Password has been reset with the new password.",
    });
  }),

  http.post(`${BASE_URL}/auth/password/change/`, () => {
    return HttpResponse.json({ detail: "New password has been saved." });
  }),

  // Songs handlers

  http.get(`${BASE_URL}/songs/`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase();

    let results = [...songs];
    if (search) {
      results = results.filter((s) => s.title.toLowerCase().includes(search));
    }

    return HttpResponse.json({
      count: results.length,
      next: null,
      previous: null,
      results: results, // Mimicking the PaginatedResponse.
    });
  }),

  http.get(`${BASE_URL}/songs/search/`, ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase() || "";
    const results = songs.filter((s) => s.title.toLowerCase().includes(q));
    return HttpResponse.json(results);
  }),

  http.get(`${BASE_URL}/songs/:id/`, ({ params }) => {
    const songId = parseInt(params.id as string, 10);
    const song = songs.find((s) => s.id === songId);
    if (song) return HttpResponse.json(song);
    return new HttpResponse(null, { status: 404 });
  }),

  http.post(`${BASE_URL}/songs/`, async ({ request }) => {
    const payload = (await request.json()) as Partial<Song>;
    const newSong: Song = {
      id: songs.length + 1,
      title: payload.title || "New Song",
      artist: payload.artist || "Unknown Artist",
      duration: payload.duration || 0,
      file_url: payload.file_url || "",
      cover_art_url: payload.cover_art_url || "",
      uploaded_at: new Date().toISOString(),
    };
    songs.push(newSong);
    return HttpResponse.json(newSong, { status: 201 });
  }),

  http.put(`${BASE_URL}/songs/:id/`, async ({ request, params }) => {
    const songId = parseInt(params.id as string, 10);
    const updates = (await request.json()) as Partial<Song>;
    const index = songs.findIndex((s) => s.id === songId);

    if (index !== -1) {
      songs[index] = { ...songs[index], ...updates };
      return HttpResponse.json(songs[index]);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.delete(`${BASE_URL}/songs/:id/`, ({ params }) => {
    const songId = parseInt(params.id as string, 10);
    const initialLength = songs.length;
    songs = songs.filter((s) => s.id !== songId);
    if (songs.length < initialLength)
      return new HttpResponse(null, { status: 204 });
    return new HttpResponse(null, { status: 404 });
  }),

  // Playlist handlers
  http.get(`${BASE_URL}/playlists/`, () => {
    return HttpResponse.json(playlists);
  }),

  http.post(`${BASE_URL}/playlists/`, async ({ request }) => {
    const payload = (await request.json()) as Partial<Playlist>;
    const newPlaylist: Playlist = {
      id: playlists.length + 1,
      title: payload.title || "New Playlist",
      description: payload.description || "",
      is_public: payload.is_public || false,
      is_collaborative: payload.is_collaborative || false,
      cover_art_url: "https://placehold.co/220",
      owner: currentUser!,
      songs: [],
    };
    playlists.push(newPlaylist);
    return HttpResponse.json(newPlaylist, { status: 201 });
  }),

  http.get(`${BASE_URL}/playlists/:id/`, ({ params }) => {
    const playlistId = parseInt(params.id as string, 10);
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist) return HttpResponse.json(playlist);
    return new HttpResponse(null, { status: 404 });
  }),

  http.patch(`${BASE_URL}/playlists/:id/`, async ({ request, params }) => {
    const playlistId = parseInt(params.id as string, 10);
    const updates = (await request.json()) as Partial<Playlist>;
    const index = playlists.findIndex((p) => p.id === playlistId);
    if (index !== -1) {
      playlists[index] = { ...playlists[index], ...updates };
      return HttpResponse.json(playlists[index]);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.delete(`${BASE_URL}/playlists/:id/`, ({ params }) => {
    const playlistId = parseInt(params.id as string, 10);
    const initialLength = playlists.length;
    playlists = playlists.filter((p) => p.id !== playlistId);
    if (playlists.length < initialLength)
      return new HttpResponse(null, { status: 204 });
    return new HttpResponse(null, { status: 404 });
  }),

  http.post(
    `${BASE_URL}/playlists/:id/add_song/`,
    async ({ request, params }) => {
      const playlistId = parseInt(params.id as string, 10);
      const { song_id } = (await request.json()) as { song_id: number };
      const playlist = playlists.find((p) => p.id === playlistId);
      const songToAdd = songs.find((s) => s.id === song_id) || INITIAL_SONGS[0];

      if (playlist) {
        const newSongEntry = {
          id: Math.random(),
          order: playlist.songs.length + 1,
          added_at: new Date().toISOString(),
          song: songToAdd,
        };
        playlist.songs.push(newSongEntry);
        return HttpResponse.json(playlist);
      }
      return new HttpResponse(null, { status: 404 });
    },
  ),

  http.delete(
    `${BASE_URL}/playlists/:id/delete_song/`,
    async ({ request, params }) => {
      const playlistId = parseInt(params.id as string, 10);
      const { song_id } = (await request.json()) as { song_id: number };
      const playlist = playlists.find((p) => p.id === playlistId);

      if (playlist) {
        playlist.songs = playlist.songs.filter((s) => s.song.id !== song_id);
        return HttpResponse.json(playlist);
      }
      return new HttpResponse(null, { status: 404 });
    },
  ),

  // Player/history handlers
  http.get(`${BASE_URL}/history/`, ({ request }) => {
    const url = new URL(request.url);
    const songFilter = url.searchParams.get("song");

    let results = [...history];
    if (songFilter) {
      results = results.filter((h) => h.song.id === parseInt(songFilter, 10));
    }

    return HttpResponse.json({
      count: results.length,
      next: null,
      previous: null,
      results,
    });
  }),

  http.post(`${BASE_URL}/history/`, async ({ request }) => {
    const { song_id } = (await request.json()) as { song_id: number };
    const playedSong = songs.find((s) => s.id === song_id) || INITIAL_SONGS[0];

    const newHistoryEntry = {
      id: history.length + 1,
      song: playedSong,
      played_at: new Date().toISOString(),
    };

    history.unshift(newHistoryEntry);
    return HttpResponse.json(newHistoryEntry, { status: 201 });
  }),

  // Cloudinary upload handler.
  http.post(
    "https://api.cloudinary.com/v1_1/:cloudName/:resourceType/upload",
    () => {
      return HttpResponse.json({
        secure_url:
          "https://res.cloudinary.com/testcloud/image/upload/v1234567890/mock_upload.jpg",
        duration: 180,
        original_filename: "mock_file",
      });
    },
  ),

  // Cloudinary signature handler.
  http.get(`${BASE_URL}/cloudinary/generate-signature/`, () => {
    return HttpResponse.json({
      signature: "sig",
      timestamp: 1234567890,
      api_key: "key",
    });
  }),
];
