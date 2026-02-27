import { type JSX, useState, useEffect, useCallback } from "react";
import { type Song } from "@/features/songs/types";
import { type Playlist } from "@/features/playlists/types";
import { listPlaylists } from "@/features/playlists/api";
import { Modal } from "@/shared/components/Modal/Modal";
import styles from "./AddToPlaylistModal.module.css";

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
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchPlaylists = async (): Promise<void> => {
        try {
          setLoading(true);
          const userPlaylists = await listPlaylists();
          setPlaylists(userPlaylists);
          setError(null);
        } catch (err) {
          setError("Failed to load playlists.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      void fetchPlaylists();
    }
  }, [isOpen]);

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
      {loading && <p>Loading playlists...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !error && (
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
