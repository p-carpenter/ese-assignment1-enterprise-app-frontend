import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { listAllSongs } from "@/features/songs/api";
import { queryKeys } from "@/shared/lib/queryKeys";
import styles from "./MoreByArtist.module.css";

interface MoreByArtistProps {
  artist: string;
  currentSongId: number;
}

export const MoreByArtist = ({ artist, currentSongId }: MoreByArtistProps) => {
  const navigate = useNavigate();

  const { data: allSongs } = useQuery({
    queryKey: queryKeys.artistSongs(artist),
    queryFn: listAllSongs,
    enabled: !!artist,
  });

  const moreSongs = (allSongs ?? []).filter(
    (s) => s.artist === artist && s.id !== currentSongId,
  );

  if (moreSongs.length === 0) return null;

  return (
    <section className={styles.moreSection}>
      <h2 className={styles.sectionTitle}>More by {artist}</h2>
      <div className={styles.moreGrid}>
        {moreSongs.map((s) => (
          <button
            key={s.id}
            className={styles.moreCard}
            onClick={() => navigate(`/songs/${s.id}`)}
          >
            <img
              src={s.cover_art_url || "https://placehold.co/80"}
              alt={s.title}
              className={styles.moreArt}
            />
            <span className={styles.moreTitle}>{s.title}</span>
            <span className={styles.moreYear}>{s.release_year ?? ""}</span>
          </button>
        ))}
      </div>
    </section>
  );
};
