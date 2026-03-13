import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSong } from "@/features/songs/api";
import { queryKeys } from "@/shared/lib/queryKeys";
import { IoCheckmarkOutline, IoCloseOutline } from "react-icons/io5";
import { AlertMessage } from "@/shared/components/AlertMessage/AlertMessage";
import { ApiError } from "@/shared/api/errors";
import styles from "./SongEditForm.module.css";

interface SongEditFormProps {
  song: {
    id: number;
    title: string;
    artist: string;
    album?: string | null;
    release_year?: string | null;
    file_url: string;
    duration: number;
    cover_art_url?: string;
  };
  onClose: () => void;
}

export const SongEditForm = ({ song, onClose }: SongEditFormProps) => {
  const queryClient = useQueryClient();

  const [editTitle, setEditTitle] = useState(song.title);
  const [editArtist, setEditArtist] = useState(song.artist);
  const [editAlbum, setEditAlbum] = useState(song.album ?? "");
  const [editYear, setEditYear] = useState(song.release_year ?? "");

  const {
    mutate: saveEdit,
    isPending: isSaving,
    isError: isSaveError,
    error: saveError,
  } = useMutation({
    mutationFn: () =>
      updateSong(song.id, {
        title: editTitle,
        artist: editArtist,
        album: editAlbum,
        release_year: editYear,
        file_url: song.file_url,
        duration: song.duration,
        cover_art_url: song.cover_art_url,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.song(song.id),
      });
      void queryClient.invalidateQueries({ queryKey: ["songs"] });
      onClose();
    },
  });

  const editErrorMessage =
    saveError instanceof ApiError
      ? saveError.getReadableMessage()
      : saveError?.message || "An unexpected error occurred.";

  return (
    <div className={styles.editFields}>
      {isSaveError && <AlertMessage message={editErrorMessage} />}

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
          onClick={onClose}
          aria-label="Cancel"
        >
          <IoCloseOutline size={20} />
          Cancel
        </button>
      </div>
    </div>
  );
};
