// src/services/api.ts
import {
  type Song,
  type SongUploadPayload,
  type UserProfile,
} from "../types/index.ts";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

interface PlayHistoryEntry {
  song: Song;
  played_at: string;
}

/**
 * Helper for fetch boilerplate
 */
const request = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const url = `${API_URL}${endpoint}`;

  const config = {
    ...options,
    credentials: "include" as RequestCredentials,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return undefined as T;
  }

  // Handle 401 Unauthorised (Session expired)
  if (response.status === 401) {
    console.warn("Unauthorised request - user may need to log in again.");
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Unknown error" }));
    throw new Error(JSON.stringify(error));
  }

  return response.json();
};

export const api = {
  songs: {
    // Fetch all songs
    list: async (): Promise<Song[]> => request<Song[]>("/songs/"),

    delete: async (songId: number): Promise<void> => {
      await request(`/songs/${songId}/`, { method: "DELETE" });
    },
    // Save a new song
    upload: async (payload: SongUploadPayload): Promise<Song> =>
      request<Song>("/songs/", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    // Update an existing song
    update: async (
      songId: number,
      payload: Partial<SongUploadPayload>,
    ): Promise<Song> =>
      request<Song>(`/songs/${songId}/`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    // Log a play event
    logPlay: async (songId: number): Promise<void> => {
      try {
        await request<void>("/history/", {
          method: "POST",
          body: JSON.stringify({ song: songId }),
        });
      } catch (err) {
        console.error("Audit log failed:", err);
      }
    },
  },

  playHistory: async (): Promise<PlayHistoryEntry[]> =>
    request<PlayHistoryEntry[]>("/history/"),

  // Auth: Register
  register: async (
    username: string,
    email: string,
    password1: string,
    password2: string,
  ): Promise<void> => {
    await request("/auth/registration/", {
      method: "POST",
      body: JSON.stringify({ username, email, password1, password2 }),
    });
  },

  // Auth: Login
  login: async (email: string, password: string): Promise<void> => {
    await request("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  // Auth: Logout
  logout: async (): Promise<void> => {
    await request("/auth/logout/", { method: "POST" });
  },

  // Auth: Check status and get user profile
  me: async (): Promise<UserProfile> => {
    console.log("Calling GET /auth/user/");
    const response = await request<UserProfile>("/auth/user/", {
      method: "GET",
    });
    console.log("User profile received:", response);
    return response;
  },
};
