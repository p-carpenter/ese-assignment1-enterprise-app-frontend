import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPlaylists } from "@/features/playlists/api";
import type { Playlist } from "@/features/playlists/types";
import styles from "./PlaylistList.module.css";
import { IoAddCircleOutline } from "react-icons/io5";
import { CreateNewPlaylistModal } from "./CreateNewPlaylistModal";
import { useAuth } from "@/shared/context/AuthContext";

export const PlaylistList = () => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const data = await listPlaylists();
      setPlaylists(data);
    } catch (err) {
      setError("Failed to fetch playlists.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPlaylists();
    }
  }, [user]);

  const handlePlaylistCreated = () => {
    fetchPlaylists(); // Refetch playlists when a new one is created
  };

  if (!user) {
    return <div>Please log in to see your playlists.</div>;
  }

  if (loading) {
    return <div>Loading playlists...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Playlists</h2>
          <div
            className={styles.addButton}
            onClick={() => setIsModalOpen(true)}
            role="button"
            aria-label="add playlist"
          >
            <IoAddCircleOutline size={24} />
          </div>
        </div>

        <ul className={styles.playlist}>
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <Link to={`/playlists/${playlist.id}`}>
                <h3>{playlist.title}</h3>
                <p>{playlist.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <CreateNewPlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPlaylistCreated={handlePlaylistCreated}
      />
    </>
  );
};
