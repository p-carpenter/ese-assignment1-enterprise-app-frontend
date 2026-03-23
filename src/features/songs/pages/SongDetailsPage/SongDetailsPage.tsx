import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getSongDetails } from "@/features/songs/api";
import { queryKeys } from "@/shared/lib/queryKeys";
import { AlertMessage } from "@/shared/components/AlertMessage/AlertMessage";
import styles from "./SongDetailsPage.module.css";

import { SongHero } from "./components/SongHero/SongHero";
import { LyricsSection } from "./components/LyricsSection/LyricsSection";
import { MoreByArtist } from "./components/MoreByArtist/MoreByArtist";

/**
 * Full song details page showing hero, lyrics and related tracks.
 * Fetches song details by id from the API and handles loading/error states.
 * @returns Song details page element.
 */
export const SongDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const songId = Number(id);

  const {
    data: song,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.song(songId!),
    queryFn: () => getSongDetails(songId!),
    enabled: !!songId && !isNaN(songId),
  });

  if (isLoading) {
    return <div className={styles.statusPage}>Loading…</div>;
  }

  if (isError || !song) {
    return (
      <div className={styles.statusPage}>
        <AlertMessage message="Song not found or an error has occurred." />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <SongHero song={song} />
        <div className={styles.columns}>
          <LyricsSection song={song} />
        </div>
        <MoreByArtist artist={song.artist} currentSongId={song.id} />
      </div>
    </div>
  );
};
