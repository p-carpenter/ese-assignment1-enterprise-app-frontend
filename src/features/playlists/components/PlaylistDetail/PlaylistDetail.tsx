import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/shared/context/AuthContext";
import {
  getPlaylistDetails,
  removeSongFromPlaylist,
} from "@/features/playlists/api";
import { AlertMessage } from "@/shared/components";
import styles from "./PlaylistDetail.module.css";
import { SongList } from "@/features/songs/components/SongList/SongList";
import { type DropdownItem } from "@/features/songs/components/SongManagementDropdown/SongManagementDropdown";
import { type Song } from "@/features/songs/types";
import { queryKeys } from "@/shared/lib/queryKeys";
import { AddSongToPlaylistModal } from "../AddSongToPlaylistModal/AddSongToPlaylistModal";
import { PlaylistHero } from "../PlaylistHero/PlaylistHero";

export const PlaylistDetail = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const parsedId = parseInt(playlistId ?? "0", 10);

  const {
    data: playlist,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.playlist(parsedId),
    queryFn: () => getPlaylistDetails(parsedId),
    enabled: !!parsedId,
  });

  const [isAddSongOpen, setIsAddSongOpen] = useState(false);

  const removeSongMutation = useMutation({
    mutationFn: (songId: number) => removeSongFromPlaylist(parsedId, songId),
    onSuccess: () => {
      // Update the playlist details in the cache to reflect the removed song.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.playlist(parsedId),
      });

      // Invalidate the playlists list to update song counts.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.playlists,
      });
    },
  });

  const getPlaylistSongDropdownItems = useCallback(
    (song: Song): DropdownItem[] => [
      {
        label: "Remove from Playlist",
        onSelect: () => removeSongMutation.mutate(song.id),
      },
    ],
    [removeSongMutation],
  );

  if (isLoading)
    return <div className={styles.statusPage}>Loading playlist…</div>;
  if (isError || !playlist)
    return (
      <div className={styles.statusPage}>
        <AlertMessage message="Playlist not found or you don't have permission to view it." />
      </div>
    );

  const isOwner = user?.id === playlist.owner.id;
  const canAddSongs = isOwner || playlist.is_collaborative;
  const songs = playlist.songs.map((item) => item.song);
  const existingSongIds = new Set(songs.map((s) => s.id));
  const addedByMap = new Map(
    playlist.songs.map((item) => [item.song.id, item.added_by]),
  );

  const contributors = playlist.is_collaborative
    ? Array.from(
        new Map(
          [...addedByMap.values()]
            .filter((u): u is NonNullable<typeof u> => !!u)
            .map((u) => [u.id, u]),
        ).values(),
      )
    : [];

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <PlaylistHero
          playlist={playlist}
          isOwner={isOwner}
          canAddSongs={canAddSongs}
          songsCount={songs.length}
          contributors={contributors}
          onAddSongClick={() => setIsAddSongOpen(true)}
        />

        <AddSongToPlaylistModal
          playlistId={parsedId}
          existingSongIds={existingSongIds}
          isOpen={isAddSongOpen}
          onClose={() => setIsAddSongOpen(false)}
        />

        <section className={styles.songSection}>
          <h2 className={styles.sectionTitle}>Songs</h2>
          {songs.length === 0 ? (
            <p className={styles.dim}>No songs in this playlist yet.</p>
          ) : (
            <SongList
              songs={songs}
              getDropdownItems={getPlaylistSongDropdownItems}
              getAvatarUser={(song) => addedByMap.get(song.id)}
            />
          )}
        </section>
      </div>
    </div>
  );
};
