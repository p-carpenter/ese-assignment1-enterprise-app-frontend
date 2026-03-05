import { useState, useCallback } from "react";
import { type Song } from "@/features/songs/types";
import { usePlayer } from "@/shared/context/PlayerContext";
import { deleteSong } from "../../api";
import { addSongToPlaylist } from "@/features/playlists/api";
import { EditSongModal } from "../EditSongModal/EditSongModal";
import { AddToPlaylistModal } from "@/features/playlists/components/AddToPlaylistModal/AddToPlaylistModal";
import { SongRow } from "../SongRow/SongRow";
import styles from "../SongLibrary/SongLibrary.module.css";
import { type DropdownItem } from "../SongManagementDropdown/SongManagementDropdown";

interface SongListProps {
  songs: Song[];
  onSongDeleted?: (id: number) => void;
  onSongUpdated?: (song: Song) => void;
  getDropdownItems?: (song: Song) => DropdownItem[];
}

export const SongList = ({
  songs,
  onSongDeleted,
  onSongUpdated,
  getDropdownItems,
}: SongListProps) => {
  const { currentSong, playSong } = usePlayer();

  const [editSong, setEditSong] = useState<Song | null>(null);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(
    null,
  );

  const handlePlay = useCallback(
    (song: Song) => {
      void playSong(song, songs);
    },
    [playSong, songs],
  );

  const handleEdit = useCallback((song: Song) => {
    setEditSong(song);
  }, []);

  const handleDelete = useCallback(
    async (songId: number) => {
      try {
        await deleteSong(songId);
        onSongDeleted?.(songId);
      } catch (error) {
        console.error("Error deleting song:", error);
        alert("Failed to delete song. Please try again.");
      }
    },
    [onSongDeleted],
  );

  const handleOpenAddToPlaylistModal = useCallback((song: Song) => {
    setSongToAddToPlaylist(song);
  }, []);

  const generateDropdownItems = useCallback(
    (song: Song): DropdownItem[] => [
      { label: "Edit", onSelect: () => handleEdit(song) },
      { label: "Delete", onSelect: () => handleDelete(song.id) },
      {
        label: "Add to Playlist",
        onSelect: () => handleOpenAddToPlaylistModal(song),
      },
    ],
    [handleEdit, handleDelete, handleOpenAddToPlaylistModal],
  );

  if (!songs || songs.length === 0) {
    return <p>No songs found.</p>;
  }

  return (
    <>
      <ul className={styles.list}>
        {songs.map((song) => (
          <SongRow
            key={song.id}
            song={song}
            isActive={currentSong?.id === song.id}
            onPlay={handlePlay}
            dropdownItems={
              getDropdownItems
                ? getDropdownItems(song)
                : generateDropdownItems(song)
            }
          />
        ))}
      </ul>

      {editSong && (
        <EditSongModal
          song={editSong}
          isOpen={true}
          onClose={() => setEditSong(null)}
          onSongUpdated={(updatedSong) => {
            setEditSong(null);
            onSongUpdated?.(updatedSong);
          }}
        />
      )}

      {songToAddToPlaylist && (
        <AddToPlaylistModal
          song={songToAddToPlaylist}
          isOpen={true}
          onClose={() => setSongToAddToPlaylist(null)}
          onSongAdded={async (playlistId) => {
            try {
              await addSongToPlaylist(playlistId, songToAddToPlaylist.id);
              setSongToAddToPlaylist(null);
            } catch (error) {
              console.error("Error adding song:", error);
              alert("Failed to add song. Please try again.");
            }
          }}
        />
      )}
    </>
  );
};
