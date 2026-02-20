import { type Song } from "@/features/songs/types";

export interface PlayHistoryEntry {
    song: Song;
    played_at: string;
}