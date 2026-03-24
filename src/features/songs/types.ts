import type { UserMini } from "@/features/auth/types";

export interface Song {
  id: number;
  title: string;
  artist: string;
  album?: string;
  release_year?: number;
  file_url: string; // The MP3 URL from Cloudinary
  cover_art_url: string;
  duration: number; // In seconds
  uploaded_at: string; // ISO date string
  uploaded_by?: UserMini;
}

export interface SongUploadPayload {
  title: string;
  artist: string;
  album?: string | null;
  release_year?: number | null;
  file_url: string;
  cover_art_url: string;
  duration: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface JamendoTrack {
  id: string;
  name: string;
  artist_name: string;
  album_name?: string;
  releasedate?: string;
  duration: number;
  audio: string;
  audiodownload?: string;
  image?: string;
}
