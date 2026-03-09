import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { usePlayer } from "@/features/player";
// import { Button } from "@/shared/components";
import { getSongDetails, listAllSongs, updateSong } from "@/features/songs/api";
import { type Song } from "@/features/songs/types";
import { getSongHistory } from "@/features/player/api";
import { queryKeys } from "@/shared/lib/queryKeys";
import { useLyrics } from "../../hooks/useLyrics";
import { SyncedLyrics } from "./components/SyncedLyrics";
import styles from "./SongDetailsPage.module.css";
import {
  IoPencilOutline,
  IoCheckmarkOutline,
  IoCloseOutline,
} from "react-icons/io5";
import { AlertMessage } from "@/shared/components/AlertMessage/AlertMessage";
import { ApiError } from "@/shared/api/errors";
import { useAuth } from "@/shared/context/AuthContext";

const fmt = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

export const SongDetailsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const songId = id ? Number(id) : null;

  const { currentSong, getPosition } = usePlayer();

  // ── Song details ──────────────────────────────────────────────────────────
  const {
    data: song,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.song(songId!),
    queryFn: () => getSongDetails(songId!),
    enabled: songId !== null,
  });

  // ── Play stats ────────────────────────────────────────────────────────────
  const { data: historyData } = useQuery({
    queryKey: queryKeys.songHistory(songId!),
    queryFn: () => getSongHistory(songId!),
    enabled: songId !== null,
  });
  const totalPlays = historyData?.count ?? 0;
  const lastPlayed = historyData?.results?.[0]?.played_at
    ? new Date(historyData.results[0].played_at).toLocaleString()
    : null;

  // ── More by artist ────────────────────────────────────────────────────────
  const { data: allSongs } = useQuery({
    queryKey: queryKeys.artistSongs(song?.artist ?? ""),
    queryFn: async () => {
      const res = await listAllSongs();
      // listAllSongs is typed as Song[] but the backend returns a paginated shape
      const songs = Array.isArray(res)
        ? res
        : ((res as unknown as { results: Song[] }).results ?? []);
      return songs;
    },
    enabled: !!song,
  });
  const moreSongs = (allSongs ?? []).filter(
    (s) => s.artist === song?.artist && s.id !== song?.id,
  );

  // ── Lyrics ────────────────────────────────────────────────────────────────
  const {
    plainLyrics,
    syncedLines,
    isLoading: lyricsLoading,
    notFound,
  } = useLyrics(song?.artist, song?.title, song?.album);

  // ── Synced lyrics position ────────────────────────────────────────────────
  const isThisSongActive = currentSong?.id === song?.id;
  const [lyricPos, setLyricPos] = useState(0);
  const lyricFrameRef = useRef<number>(0);
  useEffect(() => {
    if (!isThisSongActive || !syncedLines) return;
    const tick = () => {
      setLyricPos(getPosition());
      lyricFrameRef.current = requestAnimationFrame(tick);
    };
    lyricFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(lyricFrameRef.current);
  }, [isThisSongActive, syncedLines, getPosition]);

  // ── Inline editing ────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editAlbum, setEditAlbum] = useState("");
  const [editYear, setEditYear] = useState("");

  const startEdit = () => {
    if (!song) return;
    setEditTitle(song.title);
    setEditArtist(song.artist);
    setEditAlbum(song.album ?? "");
    setEditYear(song.release_year ?? "");
    setIsEditing(true);
  };

  const {
    mutate: saveEdit,
    isPending: isSaving,
    isError: isSaveError,
    error: saveError,
  } = useMutation({
    mutationFn: () =>
      updateSong(song!.id, {
        title: editTitle,
        artist: editArtist,
        album: editAlbum,
        release_year: editYear,
        file_url: song!.file_url,
        duration: song!.duration,
        cover_art_url: song!.cover_art_url,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.song(song!.id),
      });
      void queryClient.invalidateQueries({ queryKey: ["songs"] });
      setIsEditing(false);
    },
  });

  const editErrorMessage =
    saveError instanceof ApiError
      ? saveError.getReadableMessage()
      : saveError?.message || "An unexpected error occurred.";

  // ── Loading / error states ────────────────────────────────────────────────
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

  const coverUrl = song.cover_art_url || "https://placehold.co/400";

  return (
    <div className={styles.page}>
      {/* Content sits above background */}
      <div className={styles.content}>
        {/* Back
        <Button variant="outlined" size="small" onClick={() => navigate(-1)}>
          ← Back
        </Button> */}

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className={styles.hero}>
          <img src={coverUrl} alt={song.title} className={styles.coverArt} />

          <div className={styles.heroInfo}>
            {isSaveError && <AlertMessage message={editErrorMessage} />}

            {isEditing ? (
              <div className={styles.editFields}>
                <input
                  className={styles.editInput}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Title"
                />
                <input
                  className={styles.editInput}
                  value={editArtist}
                  onChange={(e) => setEditArtist(e.target.value)}
                  placeholder="Artist"
                />
                <input
                  className={styles.editInput}
                  value={editAlbum}
                  onChange={(e) => setEditAlbum(e.target.value)}
                  placeholder="Album"
                />
                <input
                  className={styles.editInput}
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  placeholder="Release year"
                />
                <div className={styles.editActions}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => saveEdit()}
                    disabled={isSaving}
                    aria-label="Save"
                  >
                    <IoCheckmarkOutline size={20} />
                    {isSaving ? "Saving…" : "Save"}
                  </button>
                  <button
                    className={styles.iconBtn}
                    onClick={() => setIsEditing(false)}
                    aria-label="Cancel"
                  >
                    <IoCloseOutline size={20} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className={styles.heroLabel}>Song</p>
                <h1 className={styles.heroTitle}>{song.title}</h1>
                <p className={styles.heroArtist}>{song.artist}</p>
                {(song.album || song.release_year) && (
                  <p className={styles.heroMeta}>
                    {[song.album, song.release_year]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                <p className={styles.heroMeta}>{fmt(song.duration)}</p>
                <p className={styles.heroMeta}>
                  Uploaded {new Date(song.uploaded_at).toLocaleDateString()}
                </p>
                <button
                  className={styles.editBtn}
                  onClick={startEdit}
                  aria-label="Edit song"
                >
                  <IoPencilOutline size={14} /> Edit
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Lower content ─────────────────────────────────────────────── */}
        <div className={styles.columns}>
          {/* Lyrics */}
          <section className={styles.lyricsSection}>
            <h2 className={styles.sectionTitle}>Lyrics</h2>
            {lyricsLoading && (
              <p className={styles.dim}>Searching for lyrics…</p>
            )}
            {notFound && (
              <p className={styles.dim}>No lyrics found for this song.</p>
            )}
            {!lyricsLoading &&
            !notFound &&
            isThisSongActive &&
            syncedLines &&
            syncedLines.length > 0 ? (
              <SyncedLyrics lines={syncedLines} position={lyricPos} />
            ) : !lyricsLoading && !notFound && plainLyrics ? (
              <pre className={styles.plainLyrics}>{plainLyrics}</pre>
            ) : null}
          </section>

          {/* Stats */}
          <section className={styles.statsSection}>
            <h2 className={styles.sectionTitle}>Play Stats</h2>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{totalPlays}</span>
              <span className={styles.statLabel}>total plays</span>
            </div>
            {lastPlayed && (
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Last played</span>
                <span className={styles.statValue}>{lastPlayed}</span>
              </div>
            )}
            {totalPlays === 0 && (
              <p className={styles.dim}>No plays recorded yet.</p>
            )}
          </section>
        </div>

        {/* ── More by artist ────────────────────────────────────────────── */}
        {moreSongs.length > 0 && (
          <section className={styles.moreSection}>
            <h2 className={styles.sectionTitle}>More by {song.artist}</h2>
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
                  <span className={styles.moreYear}>
                    {s.release_year ?? ""}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
