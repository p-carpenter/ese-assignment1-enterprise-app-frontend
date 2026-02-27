import { useState, useCallback, memo, type JSX } from "react";
import { type Song } from "../../types";
import styles from "./SongLibrary.module.css";
import { SongManagementDropdown } from "../SongManagementDropdown/SongManagementDropdown";
import { deleteSong } from "../../api";
import { EditSongModal } from "../EditSongModal/EditSongModal";
import { usePlayer } from "../../../../shared/context/PlayerContext";

const SongRow = memo(
  ({
    song,
    isActive,
    onPlay,
    onEdit,
    onDelete,
  }: {
    song: Song;
    isActive: boolean;
    onPlay: (song: Song) => void;
    onEdit: (song: Song) => void;
    onDelete: (id: number) => void;
  }) => {
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
          <SongManagementDropdown
            dropdownItems={[
              { label: "Edit", onSelect: () => onEdit(song) },
              { label: "Delete", onSelect: () => onDelete(song.id) },
            ]}
          />
        </div>
      </li>
    );
  },
);

SongRow.displayName = "SongRow";

export const SongLibrary = (): JSX.Element => {
  const { songs, currentSong, playSong, refreshSongs } = usePlayer();

  const [editSong, setEditSong] = useState<Song | null>(null);

  const handlePlay = useCallback(
    (song: Song) => {
      void playSong(song);
    },
    [playSong],
  );

  const handleEdit = useCallback((song: Song) => {
    setEditSong(song);
  }, []);

  const handleDelete = useCallback(
    async (songId: number) => {
      try {
        await deleteSong(songId);
        void refreshSongs();
      } catch (error) {
        console.error("Error deleting song:", error);
        alert("Failed to delete song. Please try again.");
      }
    },
    [refreshSongs],
  );

  return (
    <div className={styles.songList}>
      <h3 className={styles.libraryTitle}>Library ({songs.length} tracks)</h3>
      <ul className={styles.list}>
        {songs.map((song) => (
          <SongRow
            key={song.id}
            song={song}
            isActive={currentSong?.id === song.id}
            onPlay={handlePlay}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </ul>

      {editSong && (
        <EditSongModal
          song={editSong}
          isOpen={true}
          onClose={() => setEditSong(null)}
          onSongUpdated={refreshSongs}
        />
      )}
    </div>
  );
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};
