import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listPlaylists } from "@/features/playlists/api";
import styles from "./PlaylistList.module.css";
import { IoAddCircleOutline } from "react-icons/io5";
import { CreateNewPlaylistModal } from "./CreateNewPlaylistModal";
import { useAuth } from "@/shared/context/AuthContext";
import { queryKeys } from "@/shared/lib/queryKeys";

export const PlaylistList = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: playlists = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.playlists,
    queryFn: listPlaylists,
    enabled: !!user,
  });

  if (!user) {
    return <div>Please log in to see your playlists.</div>;
  }

  if (isLoading) {
    return <div>Loading playlists...</div>;
  }

  if (isError) {
    return <div>Error: Failed to fetch playlists.</div>;
  }

  return (
    <>
      <div className={styles.container}>
        <span className={styles.title}>Playlists</span>
        <div className={styles.header}>
          <p>Create Playlist</p>
          <div
            className={styles.addButton}
            onClick={() => setIsModalOpen(true)}
            role="button"
            aria-label="add playlist"
          >
            <IoAddCircleOutline size={16} />
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
      />
    </>
  );
};
