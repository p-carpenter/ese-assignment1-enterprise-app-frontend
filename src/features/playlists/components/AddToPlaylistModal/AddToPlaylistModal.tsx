import { type JSX, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { type Song } from "@/features/songs/types";
import { listPlaylists } from "@/features/playlists/api";
import { Modal } from "@/shared/components/Modal/Modal";
import { AlertMessage } from "@/shared/components";
import styles from "./AddToPlaylistModal.module.css";
import { queryKeys } from "@/shared/lib/queryKeys";
import { CreateNewPlaylistModal } from "../CreateNewPlaylistModal";
import { type Playlist } from "../../types";

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
  const {
    data: playlists = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.playlists,
    queryFn: listPlaylists,
    enabled: isOpen,
  });

  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handlePlaylistSelect = useCallback(
    (playlistId: number) => {
      onSongAdded(playlistId);
      onClose();
    },
    [onSongAdded, onClose],
  );

  const handleCreateSuccess = (playlist: Playlist) => {
    setIsCreateModalOpen(false);
    onSongAdded(playlist.id);
    onClose();
    navigate(`/playlists/${playlist.id}`);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Add "${song.title}" to a playlist`}
      >
        {isLoading && <p>Loading playlists...</p>}
        {isError && <AlertMessage message="Failed to load playlists." />}
        {!isLoading && !isError && (
          <ul className={styles.playlistList}>
            <li
              className={styles.playlistItem}
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                fontWeight: "bold",
                borderBottom: playlists.length
                  ? "1px solid var(--color-border)"
                  : "none",
              }}
            >
              + Create New Playlist
            </li>
            {playlists.length > 0
              ? playlists.map((playlist) => (
                  <li
                    key={playlist.id}
                    className={styles.playlistItem}
                    onClick={() => handlePlaylistSelect(playlist.id)}
                  >
                    {playlist.title}
                  </li>
                ))
              : null}
          </ul>
        )}
      </Modal>
      <CreateNewPlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};
