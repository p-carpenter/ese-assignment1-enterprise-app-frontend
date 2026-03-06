import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deletePlaylist,
  getPlaylistDetails,
  removeSongFromPlaylist,
} from "@/features/playlists/api";
import type { Playlist } from "@/features/playlists/types";
import styles from "./PlaylistDetail.module.css";
import { SongList } from "@/features/songs/components/SongList/SongList";
import { Button } from "@/shared/components/Button/Button";
import { type DropdownItem } from "@/features/songs/components/SongManagementDropdown/SongManagementDropdown";
import { type Song } from "@/features/songs/types";
import { usePlayer } from "@/shared/context/PlayerContext";

export const PlaylistDetail = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { incrementPlaylistTick } = usePlayer();

  const fetchPlaylist = useCallback(async () => {
    if (!playlistId) return;
    try {
      setError(null); // Clear errors on fresh fetch
      setLoading(true);
      const data = await getPlaylistDetails(parseInt(playlistId, 10));
      setPlaylist(data);
    } catch (err) {
      setError("Failed to fetch playlist details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [playlistId]);

  useEffect(() => {
    void fetchPlaylist();
  }, [fetchPlaylist]);

  const handleDeletePlaylist = useCallback(async () => {
    if (!playlist) return;
    try {
      setError(null);
      await deletePlaylist(playlist.id);
      incrementPlaylistTick();
      navigate("/");
    } catch (err) {
      setError("Failed to delete playlist.");
      console.error(err);
    }
  }, [playlist, navigate, incrementPlaylistTick]);

  const handleRemoveSongFromPlaylist = useCallback(
    async (songId: number) => {
      if (!playlist) return;
      try {
        setError(null);
        await removeSongFromPlaylist(playlist.id, songId);

        setPlaylist((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            songs: prev.songs.filter((item) => item.song.id !== songId),
          };
        });
      } catch (err) {
        setError("Failed to remove song from playlist.");
        console.error(err);
      }
    },
    [playlist],
  );

  const handleGlobalSongDeleted = useCallback((deletedSongId: number) => {
    setPlaylist((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        songs: prev.songs.filter((item) => item.song.id !== deletedSongId),
      };
    });
  }, []);

  const getPlaylistSongDropdownItems = useCallback(
    (song: Song): DropdownItem[] => [
      {
        label: "Remove from Playlist",
        onSelect: () => handleRemoveSongFromPlaylist(song.id),
      },
    ],
    [handleRemoveSongFromPlaylist],
  );

  if (loading) return <div>Loading playlist...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!playlist) return <div>Playlist not found.</div>;

  const songs = playlist.songs.map((item) => item.song);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{playlist.title}</h1>
        <p className={styles.description}>{playlist.description}</p>
        <p className={styles.owner}>Created by: {playlist.owner}</p>
        <Button variant="outlined" onClick={handleDeletePlaylist}>
          Delete Playlist
        </Button>
      </header>
      <section className={styles.songSection}>
        <h2 className={styles.songsTitle}>Songs</h2>
        <SongList
          songs={songs}
          onSongDeleted={handleGlobalSongDeleted}
          getDropdownItems={getPlaylistSongDropdownItems}
        />
      </section>
    </div>
  );
};
