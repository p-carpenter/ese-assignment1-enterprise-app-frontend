import { useState } from "react";
import { useAuth } from "@/shared/context/AuthContext";
import {
  IoPencilOutline,
  IoPlayCircleOutline,
  IoPauseCircleOutline,
} from "react-icons/io5";
import { SongEditForm } from "../SongEditForm/SongEditForm";
import styles from "./SongHero.module.css";
import type { Song } from "@/features/songs";
import { usePlayer } from "@/features/player/components";

/**
 * Format seconds to M:SS for display in the hero header.
 * @param s Number of seconds.
 * @returns A string like "4:20".
 */
const fmt = (s: number) => {
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

interface SongHeroProps {
  song: Song;
}

/**
 * Prominent header section for a song details page.
 * Displays cover art, title, artist, metadata and play/edit controls.
 * @param props `SongHeroProps` containing the `song` to display.
 * @returns A hero element for the song.
 */
export const SongHero = (props: SongHeroProps) => {
  const { user } = useAuth();
  const { playSong, pause, play, isPlaying, currentSong } = usePlayer();
  const [isEditing, setIsEditing] = useState(false);

  const canEdit = props.song.uploaded_by?.id === user?.id;
  const coverUrl = props.song.cover_art_url || "https://placehold.co/220";
  const isSongPlaying = currentSong?.id === props.song.id && isPlaying;

  const handlePlayClick = () => {
    if (currentSong?.id === props.song.id) {
      if (isPlaying) {
        pause();
      } else {
        play();
      }
    } else {
      playSong(props.song, [props.song]);
    }
  };

  return (
    <div className={styles.hero}>
      <img src={coverUrl} alt={props.song.title} className={styles.coverArt} />

      <div className={styles.heroInfo}>
        <p className={styles.heroLabel}>Song</p>
        {isEditing ? (
          <SongEditForm song={props.song} onClose={() => setIsEditing(false)} />
        ) : (
          <>
            <h1 className={styles.heroTitle}>{props.song.title}</h1>
            <p className={styles.heroArtist}>{props.song.artist}</p>
            {(props.song.album || props.song.release_year) && (
              <p className={styles.heroMeta}>
                {[props.song.album, props.song.release_year]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <p className={styles.heroMeta}>{fmt(props.song.duration)}</p>
            <div className={styles.heroActions}>
              <button
                className={`${styles.editBtn} ${styles.playBtn}`}
                onClick={handlePlayClick}
                aria-label={isSongPlaying ? "Pause song" : "Play song"}
              >
                {isSongPlaying ? (
                  <IoPauseCircleOutline size={16} />
                ) : (
                  <IoPlayCircleOutline size={16} />
                )}
                {isSongPlaying ? "Pause" : "Play"}
              </button>
              {canEdit && (
                <button
                  className={styles.editBtn}
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit song"
                >
                  <IoPencilOutline size={14} /> Edit
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
