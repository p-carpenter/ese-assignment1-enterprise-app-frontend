import { type Song } from "@/features/songs/types";

export interface PlayHistoryEntry {
  id: number;
  song: Song;
  played_at: string;
}

export interface PagedPlayHistory {
  count: number;
  results: PlayHistoryEntry[];
}
