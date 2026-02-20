import { useState, type JSX } from "react";
import { type Song } from "../../types";
import styles from "./SongLibrary.module.css";
import { SongManagementDropdown } from "../SongManagementDropdown/SongManagementDropdown";
import { api } from "@/shared/api/client";
import { EditSongModal } from "../EditSongModal/EditSongModal";

interface SongLibraryProps {
  songs: Song[];
  currentSongId?: number;
  onSongClick: (song: Song) => void;
  onSongsChanged?: () => void;
}

export const SongLibrary = ({
  songs,
  currentSongId,
  onSongClick,
  onSongsChanged,
}: SongLibraryProps): JSX.Element => {
  const [editSong, setEditSong] = useState<Song | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleEdit = (song: Song) => {
    setEditSong(song);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleSongUpdated = () => {
    if (onSongsChanged) onSongsChanged();
  };

  const handleDelete = (songId: number) => {
    api.songs
      .delete(songId)
      .then(() => {
        if (onSongsChanged) onSongsChanged();
      })
      .catch((error) => {
        console.error("Error deleting song:", error);
        alert("Failed to delete song. Please try again.");
      });
  };

  return (
    <div className={styles.songList}>
      <h3 className={styles.libraryTitle}>Library ({songs.length} tracks)</h3>
      <ul className={styles.list}>
        {songs.map((song) => (
          <li
            key={song.id}
            onClick={() => onSongClick(song)}
            className={
              currentSongId === song.id
                ? styles.songItemActive
                : styles.songItem
            }
          >
            <div className={styles.songMeta}>
              <strong className={styles.songTitle}>{song.title}</strong>
              <br />
              <span className={styles.songArtist}>{song.artist}</span>
            </div>
            <span className={styles.duration}>{formatTime(song.duration)}</span>
            <SongManagementDropdown
              dropdownItems={[
                { label: "Edit", onSelect: () => handleEdit(song) },
                { label: "Delete", onSelect: () => handleDelete(song.id) },
              ]}
            />
          </li>
        ))}
      </ul>
      <EditSongModal
        key={editSong?.id || "empty-modal"}
        song={editSong}
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSongUpdated={handleSongUpdated}
      />
    </div>
  );
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};
