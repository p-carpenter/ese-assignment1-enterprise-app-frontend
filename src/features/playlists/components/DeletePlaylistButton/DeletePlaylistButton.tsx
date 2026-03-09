import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePlaylist } from "@/features/playlists/api";
import { queryKeys } from "@/shared/lib/queryKeys";
import { IoTrashOutline, IoCloseOutline } from "react-icons/io5";
import styles from "./DeletePlaylistButton.module.css"; // Eller en egen CSS-modul hvis du foretrekker det

interface DeletePlaylistButtonProps {
  playlistId: number;
}

export const DeletePlaylistButton = ({
  playlistId,
}: DeletePlaylistButtonProps) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const deleteMutation = useMutation({
    mutationFn: () => deletePlaylist(playlistId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
      navigate("/");
    },
  });

  if (confirmDelete) {
    return (
      <>
        <span className={styles.confirmText}>Are you sure?</span>
        <button
          className={`${styles.iconBtn} ${styles.deleteBtn}`}
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          className={styles.iconBtn}
          onClick={() => setConfirmDelete(false)}
        >
          <IoCloseOutline size={16} /> Cancel
        </button>
      </>
    );
  }

  return (
    <button
      className={`${styles.iconBtn} ${styles.deleteBtn}`}
      onClick={() => setConfirmDelete(true)}
      aria-label="Delete playlist"
    >
      <IoTrashOutline size={16} /> Delete
    </button>
  );
};
