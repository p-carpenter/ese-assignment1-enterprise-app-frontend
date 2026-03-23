import { useState } from "react";
import styles from "./PlaylistHero.module.css";
import { EditPlaylistForm } from "../EditPlaylistForm/EditPlaylistForm";
import { DeletePlaylistButton } from "../DeletePlaylistButton/DeletePlaylistButton";
import {
  IoPencilOutline,
  IoAddOutline,
  IoPlayCircleOutline,
} from "react-icons/io5";
import { type Playlist } from "@/features/playlists/types";
import { type UserMini } from "@/features/auth/types";
import { UserAvatar } from "@/shared/components/UserAvatar/UserAvatar";

interface PlaylistHeroProps {
  playlist: Playlist;
  isOwner: boolean;
  canAddSongs: boolean;
  songsCount: number;
  contributors: UserMini[];
  onAddSongClick: () => void;
  onPlayClick?: () => void;
}

/**
 * Header display for a playlist showing artwork, title and actions.
 * Supports edit, play and add-song actions depending on permissions.
 * @param props `PlaylistHeroProps` describing the playlist and available actions.
 * @returns A playlist hero element.
 */
export const PlaylistHero = ({
  playlist,
  isOwner,
  canAddSongs,
  songsCount,
  contributors,
  onAddSongClick,
  onPlayClick,
}: PlaylistHeroProps) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className={styles.hero}>
      {isOwner && isEditing ? (
        <EditPlaylistForm
          playlist={playlist}
          onClose={() => setIsEditing(false)}
        />
      ) : (
        <>
          <div className={styles.coverWrap}>
            <img
              src={playlist.cover_art_url || "https://placehold.co/220"}
              alt={playlist.title}
              className={styles.coverArt}
            />
          </div>

          <div className={styles.heroInfo}>
            <p className={styles.heroLabel}>Playlist</p>
            <div className={styles.titleRow}>
              <h1 className={styles.heroTitle}>{playlist.title}</h1>
              <span
                className={`${styles.badge} ${
                  playlist.is_public ? styles.badgePublic : styles.badgePrivate
                }`}
              >
                {playlist.is_public ? "Public" : "Private"}
              </span>

              {playlist.is_collaborative && (
                <span
                  className={`${styles.badge} ${styles.badgeCollaborative}`}
                >
                  Collaborative
                </span>
              )}
            </div>
            {playlist.description && (
              <p className={styles.heroDescription}>{playlist.description}</p>
            )}
            <div className={styles.heroMeta}>
              <span className={styles.heroMetaOwner}>
                <UserAvatar user={playlist.owner} />
                <span>{playlist.owner.username}</span>
              </span>
              <span className={styles.heroMetaDot}>·</span>
              {songsCount} {songsCount === 1 ? "song" : "songs"}
              {contributors.length > 0 && (
                <>
                  <span className={styles.heroMetaDot}>·</span>
                  <div className={styles.contributorAvatars}>
                    {contributors.slice(0, 5).map((u) => (
                      <span key={u.id} className={styles.contributorAvatar}>
                        <UserAvatar user={u} />
                      </span>
                    ))}
                    {contributors.length > 5 && (
                      <span
                        className={styles.contributorAvatar}
                        title={`${contributors.length - 5} more`}
                      >
                        +{contributors.length - 5}
                      </span>
                    )}
                  </div>
                  <span className={styles.contributorsLabel}>Contributors</span>
                </>
              )}
            </div>
            <div className={styles.heroActions}>
              {songsCount > 0 && onPlayClick && (
                <button
                  className={`${styles.editBtn} ${styles.playBtn}`}
                  onClick={onPlayClick}
                  aria-label="Play playlist"
                >
                  <IoPlayCircleOutline size={16} /> Play
                </button>
              )}
              {canAddSongs && (
                <button
                  className={styles.editBtn}
                  onClick={onAddSongClick}
                  aria-label="Add songs"
                >
                  <IoAddOutline size={14} /> Add songs
                </button>
              )}
              {isOwner && (
                <button
                  className={styles.editBtn}
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit playlist"
                >
                  <IoPencilOutline size={14} /> Edit
                </button>
              )}
              {isOwner && <DeletePlaylistButton playlistId={playlist.id} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
