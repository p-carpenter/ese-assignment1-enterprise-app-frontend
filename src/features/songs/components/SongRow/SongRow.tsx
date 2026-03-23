import { memo } from "react";
import { type Song } from "@/features/songs/types";
import type { UserMini } from "@/features/auth/types";
import { UserAvatar } from "@/shared/components/";

import {
  SongManagementDropdown,
  type DropdownItem,
} from "@/features/songs/components/SongManagementDropdown/SongManagementDropdown";
import styles from "./SongRow.module.css";
import { Link } from "react-router-dom";

interface SongRowProps {
  song: Song;
  isActive: boolean;
  onPlay: (song: Song) => void;
  dropdownItems: DropdownItem[];
  avatarUser?: UserMini;
}

/**
 * Format seconds to M:SS.
 * @param seconds Number of seconds.
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

/**
 * Single row item representing a song in a list.
 * Shows cover art, title, artist, upload date and duration and exposes a dropdown.
 * @param props Row props including song, active state and callbacks.
 */
export const SongRow = memo(
  ({ song, isActive, onPlay, dropdownItems, avatarUser }: SongRowProps) => {
    return (
      <li
        onClick={() => onPlay(song)}
        className={isActive ? styles.songItemActive : styles.songItem}
      >
        <div className={styles.librarySections}>
          <div className={styles.songMeta}>
            <img
              src={song.cover_art_url || undefined}
              alt={song.cover_art_url ? `${song.title} album art` : ""}
              className={styles.albumArt}
              onError={(e) => {
                // Hide broken images silently
                (e.target as HTMLImageElement).style.visibility = "hidden";
              }}
            />
            <div className={styles.songTitleArtist}>
              <Link to={`/songs/${song.id}`} className={styles.songTitleLink}>
                <strong className={styles.songTitle}>{song.title}</strong>
              </Link>
              <span className={styles.songArtist}>{song.artist}</span>
            </div>
          </div>
          <span className={styles.songUploadedAt}>
            {new Date(song.uploaded_at).toDateString()}
          </span>
          <span className={styles.duration}>{formatTime(song.duration)}</span>
          {avatarUser && (
            <div className={styles.userAvatar}>
              {<UserAvatar user={avatarUser} />}
            </div>
          )}
        </div>
        <div
          className="dropdown-container"
          data-testid="dropdown-container"
          onClick={(e) => e.stopPropagation()}
        >
          <SongManagementDropdown dropdownItems={dropdownItems} />
        </div>
      </li>
    );
  },
);

SongRow.displayName = "SongRow";
