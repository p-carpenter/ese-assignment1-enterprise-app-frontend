import { type JSX, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { type Song } from "@/features/songs/types";
import { listPlaylists } from "@/features/playlists/api";
import { Modal } from "@/shared/components/Modal/Modal";
import { AlertMessage } from "@/shared/components";
import styles from "./AddToPlaylistModal.module.css";
import { queryKeys } from "@/shared/lib/queryKeys";

interface AddToPlaylistModalProps {
  song: Song;
  isOpen: boolean;
  onClose: () => void;
  onSongAdded: (playlistId: number) => void;
}

export const AddToPlaylistModal = ({
  song,
  isOpen,
  onClose,
  onSongAdded,
}: AddToPlaylistModalProps): JSX.Element => {
  // Reuses the shared ['playlists'] cache; no duplicate network call if PlaylistList
  // has already fetched recently.
  const {
    data: playlists = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.playlists,
    queryFn: listPlaylists,
    enabled: isOpen,
  });

  const handlePlaylistSelect = useCallback(
    (playlistId: number) => {
      onSongAdded(playlistId);
      onClose();
    },
    [onSongAdded, onClose],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add "${song.title}" to a playlist`}
    >
      {isLoading && <p>Loading playlists...</p>}
      {isError && <AlertMessage message="Failed to load playlists." />}
      {!isLoading && !isError && (
        <ul className={styles.playlistList}>
          {playlists.length > 0 ? (
            playlists.map((playlist) => (
              <li
                key={playlist.id}
                className={styles.playlistItem}
                onClick={() => handlePlaylistSelect(playlist.id)}
              >
                {playlist.title}
              </li>
            ))
          ) : (
            <p>No playlists found. You can create one in the Playlists page.</p>
          )}
        </ul>
      )}
    </Modal>
  );
};
