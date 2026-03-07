import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listPlaylists } from "@/features/playlists/api";
import styles from "./PlaylistList.module.css";
import {
  IoAddCircleOutline,
  IoPeopleOutline,
  IoEarthOutline,
} from "react-icons/io5";
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
        <div className={styles.header}>
          <Link to="/playlists" className={styles.title}>
            Playlists
          </Link>
          <button
            className={styles.addButton}
            onClick={() => setIsModalOpen(true)}
            aria-label="Create playlist"
          >
            <IoAddCircleOutline size={18} />
          </button>
        </div>
        <ul className={styles.playlist}>
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <Link
                to={`/playlists/${playlist.id}`}
                className={styles.playlistLink}
              >
                <div className={styles.thumb}>
                  {playlist.cover_art_url ? (
                    <img
                      src={playlist.cover_art_url}
                      alt={playlist.title}
                      className={styles.thumbImg}
                    />
                  ) : (
                    <div className={styles.thumbFallback} />
                  )}
                </div>
                <div className={styles.info}>
                  <span className={styles.name}>{playlist.title}</span>
                  <div className={styles.meta}>
                    <span className={styles.songCount}>
                      {playlist.songs.length}{" "}
                      {playlist.songs.length === 1 ? "song" : "songs"}
                    </span>
                    {playlist.is_public && (
                      <span className={styles.badge} title="Public">
                        <IoEarthOutline size={12} />
                      </span>
                    )}
                    {playlist.is_collaborative && (
                      <span className={styles.badge} title="Collaborative">
                        <IoPeopleOutline size={12} />
                      </span>
                    )}
                  </div>
                </div>
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
