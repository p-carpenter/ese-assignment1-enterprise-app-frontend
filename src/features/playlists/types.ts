import type { Song } from "@/features/songs/types";

export type PlaylistSong = {
  id: number;
  order: number;
  added_at: string;
  song: Song;
};

export interface Playlist {
  id: number;
  title: string;
  description: string;
  is_public: boolean;
  owner: number;
  songs: PlaylistSong[];
}
