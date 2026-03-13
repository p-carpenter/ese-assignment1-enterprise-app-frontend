import { useState } from "react";
import { useAuth } from "@/shared/context/AuthContext";
import { IoPencilOutline } from "react-icons/io5";
import { SongEditForm } from "../SongEditForm/SongEditForm";
import styles from "./SongHero.module.css";
import type { Song } from "@/features/songs";

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

interface SongHeroProps {
  song: Song;
}

export const SongHero = ({ song }: SongHeroProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const canEdit = song.uploaded_by?.id === user?.id;
  const coverUrl = song.cover_art_url || "https://placehold.co/400";

  return (
    <div className={styles.hero}>
      <img src={coverUrl} alt={song.title} className={styles.coverArt} />

      <div className={styles.heroInfo}>
        <p className={styles.heroLabel}>Song</p>
        {isEditing ? (
          <SongEditForm song={song} onClose={() => setIsEditing(false)} />
        ) : (
          <>
            <h1 className={styles.heroTitle}>{song.title}</h1>
            <p className={styles.heroArtist}>{song.artist}</p>
            {(song.album || song.release_year) && (
              <p className={styles.heroMeta}>
                {[song.album, song.release_year].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className={styles.heroMeta}>{fmt(song.duration)}</p>
            <p className={styles.heroMeta}></p>
            {canEdit && (
              <button
                className={styles.editBtn}
                onClick={() => setIsEditing(true)}
                aria-label="Edit song"
              >
                <IoPencilOutline size={14} /> Edit
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
