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
  onSongDeleted?: () => void;
  getDropdownItems?: (song: Song) => DropdownItem[];
}

export const SongList = ({
  songs,
  onSongDeleted,
  getDropdownItems,
}: SongListProps) => {
  const { currentSong, playSong, refreshSongs } = usePlayer();
  const [editSong, setEditSong] = useState<Song | null>(null);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(
    null,
  );

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
        if (onSongDeleted) {
          onSongDeleted();
        } else {
          void refreshSongs();
        }
      } catch (error) {
        console.error("Error deleting song:", error);
        alert("Failed to delete song. Please try again.");
      }
    },
    [refreshSongs, onSongDeleted],
  );

  const handleOpenAddToPlaylistModal = useCallback((song: Song) => {
    setSongToAddToPlaylist(song);
  }, []);

  const handleCloseAddToPlaylistModal = useCallback(() => {
    setSongToAddToPlaylist(null);
  }, []);

  const handleSongAddedToPlaylist = useCallback(
    async (playlistId: number) => {
      if (!songToAddToPlaylist) return;
      try {
        await addSongToPlaylist(playlistId, songToAddToPlaylist.id);
        // Maybe show a success notification later
      } catch (error) {
        console.error("Error adding song to playlist:", error);
        alert("Failed to add song to playlist. Please try again.");
      }
    },
    [songToAddToPlaylist],
  );

  const defaultGetDropdownItems = (song: Song): DropdownItem[] => [
    { label: "Edit", onSelect: () => handleEdit(song) },
    { label: "Delete", onSelect: () => handleDelete(song.id) },
    {
      label: "Add to Playlist",
      onSelect: () => handleOpenAddToPlaylistModal(song),
    },
  ];

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
                : defaultGetDropdownItems(song)
            }
          />
        ))}
      </ul>

      {editSong && (
        <EditSongModal
          song={editSong}
          isOpen={true}
          onClose={() => setEditSong(null)}
          onSongUpdated={onSongDeleted ?? refreshSongs}
        />
      )}
      {songToAddToPlaylist && (
        <AddToPlaylistModal
          song={songToAddToPlaylist}
          isOpen={true}
          onClose={handleCloseAddToPlaylistModal}
          onSongAdded={handleSongAddedToPlaylist}
        />
      )}
    </>
  );
};
