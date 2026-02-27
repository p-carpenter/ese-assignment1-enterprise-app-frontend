import { memo } from "react";
import { type Song } from "@/features/songs/types";
import {
  SongManagementDropdown,
  type DropdownItem,
} from "@/features/songs/components/SongManagementDropdown/SongManagementDropdown";
import styles from "./SongRow.module.css";

interface SongRowProps {
  song: Song;
  isActive: boolean;
  onPlay: (song: Song) => void;
  dropdownItems: DropdownItem[];
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

export const SongRow = memo(
  ({ song, isActive, onPlay, dropdownItems }: SongRowProps) => {
    return (
      <li
        onClick={(e) => {
          if ((e.target as HTMLElement).closest(".dropdown-container")) return;
          onPlay(song);
        }}
        className={isActive ? styles.songItemActive : styles.songItem}
      >
        <div className={styles.songMeta}>
          <strong className={styles.songTitle}>{song.title}</strong>
          <br />
          <span className={styles.songArtist}>{song.artist}</span>
        </div>
        <span className={styles.duration}>{formatTime(song.duration)}</span>

        <div className="dropdown-container">
          <SongManagementDropdown dropdownItems={dropdownItems} />
        </div>
      </li>
    );
  },
);

SongRow.displayName = "SongRow";
