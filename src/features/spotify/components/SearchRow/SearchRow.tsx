import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SpotifyTrack } from "../../types";
import styles from "./SearchRow.module.css";
import { queryKeys } from "@/shared/lib/queryKeys";

interface SearchRowProps {
  track: SpotifyTrack;
  isAlreadyAdded: boolean;
  onUpload: (track: SpotifyTrack) => Promise<void>;
}

export const SearchRow = ({
  track,
  isAlreadyAdded,
  onUpload,
}: SearchRowProps) => {
  const queryClient = useQueryClient();

  const { mutate: addTrack, isPending } = useMutation({
    mutationFn: () => onUpload(track),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.allSongs });
    },
    onError: (err) => {
      console.error("Failed to add track:", err);
    },
  });

  const cover =
    track.album.images.find((img) => img.width <= 64) ??
    track.album.images[track.album.images.length - 1];

  return (
    <div className={styles.resultRow}>
      {cover && (
        <img className={styles.cover} src={cover.url} alt={track.album.name} />
      )}
      <div className={styles.meta}>
        <div className={styles.trackName}>{track.name}</div>
        <div className={styles.trackSub}>
          {track.artists.map((a) => a.name).join(", ")} · {track.album.name}
        </div>
      </div>
      <button
        className={styles.addBtn}
        onClick={() => addTrack()}
        disabled={isPending || isAlreadyAdded}
      >
        {isAlreadyAdded ? "Added ✓" : isPending ? "Adding…" : "Add"}
      </button>
    </div>
  );
};
