import type { Song } from "@/features/songs/types";
import type { UserMini } from "@/features/auth/types";

export type PlaylistSong = {
  id: number;
  order: number;
  added_at: string;
  added_by?: UserMini;
  song: Song;
};

export interface PlaylistOwner {
  id: number;
  username: string;
  avatar_url?: string;
}

export interface Playlist {
  id: number;
  title: string;
  description?: string;
  is_public: boolean;
  is_collaborative: boolean;
  cover_art_url: string | null;
  owner: PlaylistOwner;
  songs: PlaylistSong[];
}
