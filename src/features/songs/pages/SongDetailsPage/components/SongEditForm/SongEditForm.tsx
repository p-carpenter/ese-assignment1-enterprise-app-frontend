import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateSong } from "@/features/songs/api";
import { queryKeys } from "@/shared/lib/queryKeys";
import { IoCheckmarkOutline, IoCloseOutline } from "react-icons/io5";
import { AlertMessage } from "@/shared/components/AlertMessage/AlertMessage";
import { ApiError } from "@/shared/api/errors";
import styles from "./SongEditForm.module.css";
import { songEditSchema, type SongEditFormValues } from "./schema";

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SongEditFormValues>({
    resolver: zodResolver(songEditSchema),
    defaultValues: {
      title: song.title,
      artist: song.artist,
      album: song.album ?? "",
      releaseYear: song.release_year ?? "",
    },
  });

  const {
    mutate: saveEdit,
    isPending: isSaving,
    isError: isSaveError,
    error: saveError,
  } = useMutation({
    mutationFn: (data: SongEditFormValues) =>
      updateSong(song.id, {
        title: data.title,
        artist: data.artist,
        album: data.album,
        release_year: data.releaseYear,
        file_url: song.file_url,
        duration: song.duration,
        cover_art_url: song.cover_art_url,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.song(song.id),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.allSongs });
      onClose();
    },
  });

  const onFormSubmit = (data: SongEditFormValues) => {
    saveEdit(data);
  };

  const editErrorMessage =
    saveError instanceof ApiError
      ? saveError.getReadableMessage()
      : saveError?.message || "An unexpected error occurred.";

  return (
    <form className={styles.editFields} onSubmit={handleSubmit(onFormSubmit)}>
      {isSaveError && <AlertMessage message={editErrorMessage} />}

      <div className={styles.inputGroup}>
        <input
          className={styles.editInput}
          placeholder="Title"
          aria-label="Title"
          {...register("title")}
        />
        {errors.title && (
          <span className={styles.errorText} role="alert">
            {errors.title.message}
          </span>
        )}
      </div>

      <div className={styles.inputGroup}>
        <input
          className={styles.editInput}
          placeholder="Artist"
          aria-label="Artist"
          {...register("artist")}
        />
        {errors.artist && (
          <span className={styles.errorText} role="alert">
            {errors.artist.message}
          </span>
        )}
      </div>

      <div className={styles.inputGroup}>
        <input
          className={styles.editInput}
          placeholder="Album"
          aria-label="Album"
          {...register("album")}
        />
        {errors.album && (
          <span className={styles.errorText} role="alert">
            {errors.album.message}
          </span>
        )}
      </div>

      <div className={styles.inputGroup}>
        <input
          className={styles.editInput}
          placeholder="Release year"
          aria-label="Release year"
          {...register("releaseYear")}
        />
        {errors.releaseYear && (
          <span className={styles.errorText} role="alert">
            {errors.releaseYear.message}
          </span>
        )}
      </div>

      <div className={styles.editActions}>
        <button
          type="submit"
          className={styles.iconBtn}
          disabled={isSaving}
          aria-label="Save"
        >
          <IoCheckmarkOutline size={20} />
          {isSaving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={onClose}
          aria-label="Cancel"
        >
          <IoCloseOutline size={20} />
          Cancel
        </button>
      </div>
    </form>
  );
};
