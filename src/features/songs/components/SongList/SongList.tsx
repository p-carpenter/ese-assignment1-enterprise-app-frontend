import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type Song } from "@/features/songs/types";
import { usePlayer } from "@/shared/context/PlayerContext";
import { deleteSong } from "../../api";
import { addSongToPlaylist } from "@/features/playlists/api";
import { EditSongModal } from "../EditSongModal/EditSongModal";
import { AddToPlaylistModal } from "@/features/playlists/components/AddToPlaylistModal/AddToPlaylistModal";
import { SongRow } from "../SongRow/SongRow";
import styles from "../SongLibrary/SongLibrary.module.css";
import { type DropdownItem } from "../SongManagementDropdown/SongManagementDropdown";
import { IoTimeOutline } from "react-icons/io5";
interface SongListProps {
  songs: Song[];
  getDropdownItems?: (song: Song) => DropdownItem[];
  getAvatarUser?: (
    song: Song,
  ) => import("@/features/songs/types").UserMini | undefined;
}

export const SongList = ({
  songs,
  getDropdownItems,
  getAvatarUser,
}: SongListProps) => {
  const { currentSong, playSong } = usePlayer();
  const queryClient = useQueryClient();

  const [editSong, setEditSong] = useState<Song | null>(null);
  const [songToAddToPlaylist, setSongToAddToPlaylist] = useState<Song | null>(
    null,
  );

  const deleteMutation = useMutation({
    mutationFn: (songId: number) => deleteSong(songId),
    onSuccess: () => {
      // Invalidate the infinite songs list and any open playlist detail
      void queryClient.invalidateQueries({ queryKey: ["songs"] });
      void queryClient.invalidateQueries({ queryKey: ["playlist"] });
    },
    onError: () => {
      console.error("Failed to delete song");
    },
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: ({
      playlistId,
      songId,
    }: {
      playlistId: number;
      songId: number;
    }) => addSongToPlaylist(playlistId, songId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["playlist"] });
      setSongToAddToPlaylist(null);
    },
    onError: () => {
      // ADD UI ERROR MESSAGE
      console.error("Error adding song to playlist");
    },
  });

  const handlePlay = useCallback(
    (song: Song) => {
      void playSong(song, songs);
    },
    [playSong, songs],
  );

  const handleEdit = useCallback((song: Song) => {
    setEditSong(song);
  }, []);

  const generateDropdownItems = useCallback(
    (song: Song): DropdownItem[] => [
      { label: "Edit", onSelect: () => handleEdit(song) },
      {
        label: "Delete",
        onSelect: () => deleteMutation.mutate(song.id),
        disabled: deleteMutation.isPending,
      },
      {
        label: "Add to Playlist",
        onSelect: () => setSongToAddToPlaylist(song),
      },
    ],
    [handleEdit, deleteMutation],
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
          onSongUpdated={() => setEditSong(null)}
        />
      )}

      {songToAddToPlaylist && (
        <AddToPlaylistModal
          song={songToAddToPlaylist}
          isOpen={true}
          onClose={() => setSongToAddToPlaylist(null)}
          onSongAdded={(playlistId) => {
            addToPlaylistMutation.mutate({
              playlistId,
              songId: songToAddToPlaylist.id,
            });
          }}
        />
      )}
    </>
  );
};
