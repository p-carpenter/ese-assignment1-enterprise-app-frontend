import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/shared/components/Modal/Modal";
import { AlertMessage } from "@/shared/components";
import { SongRow } from "@/features/songs/components/SongRow/SongRow";
import { listAllSongs } from "@/features/songs/api";
import { addSongToPlaylist } from "@/features/playlists/api";
import { queryKeys } from "@/shared/lib/queryKeys";
import { usePlayer } from "@/shared/context/PlayerContext";
import { type Song } from "@/features/songs/types";
import { ApiError } from "@/shared/api/errors";

const ALL_SONGS_KEY = ["songs"] as const;
import styles from "./AddSongToPlaylistModal.module.css";

interface AddSongToPlaylistModalProps {
  playlistId: number;
  existingSongIds: Set<number>;
  isOpen: boolean;
  onClose: () => void;
}

export const AddSongToPlaylistModal = ({
  playlistId,
  existingSongIds,
  isOpen,
  onClose,
}: AddSongToPlaylistModalProps) => {
  const queryClient = useQueryClient();
  const { currentSong } = usePlayer();
  const [search, setSearch] = useState("");
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const {
    data: allSongs = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ALL_SONGS_KEY,
    queryFn: listAllSongs,
    enabled: isOpen,
  });

  const { mutate: addSong, isPending } = useMutation({
    mutationFn: (song: Song) => addSongToPlaylist(playlistId, song.id),
    onSuccess: (_data, song) => {
      setAddedIds((prev) => new Set(prev).add(song.id));
      setError(null);

      // Update the playlist details in the cache to reflect the new song.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.playlist(playlistId),
      });

      // Update the general playlists list to reflect the new song count.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.playlists,
      });
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setError(err.getReadableMessage());
      } else {
        setError("An unexpected error occurred while adding the song.");
      }
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allSongs.filter(
      (s) =>
        !existingSongIds.has(s.id) &&
        !addedIds.has(s.id) &&
        (q === "" ||
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q)),
    );
  }, [allSongs, existingSongIds, addedIds, search]);

  const handleClose = () => {
    setSearch("");
    setAddedIds(new Set());
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add songs to playlist">
      <div className={styles.searchWrap}>
        <input
          className={styles.searchInput}
          placeholder="Search songs or artists…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {error && <AlertMessage message={error} variant="error" />}
      {isLoading && <p className={styles.hint}>Loading songs…</p>}
      {isError && <AlertMessage message="Failed to load songs." />}

      {!isLoading &&
        !isError &&
        (filtered.length === 0 ? (
          <p className={styles.hint}>
            {search
              ? "No matches found."
              : "All songs are already in this playlist."}
          </p>
        ) : (
          <ul className={styles.list}>
            {filtered.map((song) => (
              <SongRow
                key={song.id}
                song={song}
                isActive={currentSong?.id === song.id}
                onPlay={isPending ? () => {} : addSong}
                dropdownItems={[]}
              />
            ))}
          </ul>
        ))}

      {addedIds.size > 0 && (
        <p className={styles.added}>
          ✓ {addedIds.size} song{addedIds.size > 1 ? "s" : ""} added
        </p>
      )}
    </Modal>
  );
};
