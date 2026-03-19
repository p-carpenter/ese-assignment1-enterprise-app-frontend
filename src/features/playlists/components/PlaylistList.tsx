import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listPlaylists } from "@/features/playlists/api";
import { AlertMessage, Button } from "@/shared/components";
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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (!user) {
    return <div>Please log in to see your playlists.</div>;
  }

  if (isLoading) {
    return <div>Loading playlists...</div>;
  }

  if (isError) {
    return <AlertMessage message="Failed to fetch playlists." />;
  }

  return (
    <>
      <div className={styles.container}>
        {/* Scrollable top section */}
        <div className={styles.scrollArea}>
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

        {/* Auth section for mobile.*/}
        <div className={styles.authFooter}>
          <button
            className={styles.avatarButton}
            onClick={() => navigate("/profile")}
            title="View Profile"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Profile"
                className={styles.avatar}
              />
            ) : (
              <span className={styles.avatarInitial}>
                {user?.username?.[0]?.toUpperCase()}
              </span>
            )}
            <span className={styles.usernameText}>{user?.username}</span>
          </button>
          <Button variant="outlined" size="small" onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      </div>

      <CreateNewPlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
