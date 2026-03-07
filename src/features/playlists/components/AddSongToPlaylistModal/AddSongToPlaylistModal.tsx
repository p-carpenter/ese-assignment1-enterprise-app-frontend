import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/shared/components/Modal/Modal";
import { SongRow } from "@/features/songs/components/SongRow/SongRow";
import { listAllSongs } from "@/features/songs/api";
import { addSongToPlaylist } from "@/features/playlists/api";
import { queryKeys } from "@/shared/lib/queryKeys";
import { usePlayer } from "@/shared/context/PlayerContext";
import { type Song } from "@/features/songs/types";

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

  const {
    data: allSongs = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ALL_SONGS_KEY,
    queryFn: async () => {
      const res = await listAllSongs();
      return Array.isArray(res)
        ? res
        : ((res as { results: Song[] }).results ?? []);
    },
    enabled: isOpen,
  });

  const { mutate: addSong, isPending } = useMutation({
    mutationFn: (song: Song) => addSongToPlaylist(playlistId, song.id),
    onSuccess: (_data, song) => {
      setAddedIds((prev) => new Set(prev).add(song.id));
      void queryClient.invalidateQueries({
        queryKey: queryKeys.playlist(playlistId),
      });
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

      {isLoading && <p className={styles.hint}>Loading songs…</p>}
      {isError && <p className={styles.hint}>Failed to load songs.</p>}

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
