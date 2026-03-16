import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePlaylist } from "@/features/playlists/api";
import { useCloudinaryUpload } from "@/shared/hooks/useCloudinaryUpload";
import { queryKeys } from "@/shared/lib/queryKeys";
import {
  IoCheckmarkOutline,
  IoCloseOutline,
  IoImageOutline,
} from "react-icons/io5";
import styles from "./EditPlaylistForm.module.css";
import { type Playlist } from "@/features/playlists/types";
import { AlertMessage } from "@/shared/components/AlertMessage/AlertMessage";
import { ApiError } from "@/shared/api/errors";
import { editPlaylistSchema, type EditPlaylistFormValues } from "./schema";

interface EditPlaylistFormProps {
  playlist: Playlist;
  onClose: () => void;
}

export const EditPlaylistForm = ({
  playlist,
  onClose,
}: EditPlaylistFormProps) => {
  const queryClient = useQueryClient();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [editCoverUrl, setEditCoverUrl] = useState(
    playlist.cover_art_url ?? "",
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<EditPlaylistFormValues>({
    resolver: zodResolver(editPlaylistSchema),
    defaultValues: {
      title: playlist.title,
      description: playlist.description ?? "",
      is_public: playlist.is_public,
      is_collaborative: playlist.is_collaborative,
    },
  });

  const isPublic = useWatch({ control, name: "is_public" });
  const isCollaborative = useWatch({ control, name: "is_collaborative" });

  const { upload: uploadCover, isUploading: isCoverUploading } =
    useCloudinaryUpload();

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await uploadCover(file);
    if (res) setEditCoverUrl(res.secure_url);
  };

  const { mutate: saveEdit, isPending: isSaving, error: saveError } = useMutation({
    mutationFn: (data: EditPlaylistFormValues) => {
      const payload = {
        title: data.title,
        description: data.description,
        is_public: data.is_public,
        is_collaborative: data.is_collaborative,
        ...(editCoverUrl ? { cover_art_url: editCoverUrl } : {}),
      };
      return updatePlaylist(playlist.id, payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.playlist(playlist.id),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
      onClose();
    },
  });

  const onFormSubmit = (data: EditPlaylistFormValues) => {
    saveEdit(data);
  };

  const editErrorMessage =
    saveError instanceof ApiError
      ? saveError.getReadableMessage()
      : saveError?.message || "An unexpected error occurred.";

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      {saveError && <AlertMessage message={editErrorMessage} />}

      <div className={styles.coverWrap}>
        <img
          src={editCoverUrl || "https://placehold.co/220"}
          alt="Playlist cover art"
          className={styles.coverArt}
        />
        <button
          type="button"
          className={styles.coverEditBtn}
          onClick={() => coverInputRef.current?.click()}
          disabled={isCoverUploading}
          aria-label={isCoverUploading ? "Uploading cover image" : "Change playlist cover"}
        >
          <IoImageOutline size={18} aria-hidden="true" />
          {isCoverUploading ? "Uploading…" : "Change cover"}
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className={styles.hiddenInput}
          onChange={handleCoverChange}
          aria-label="Upload cover image file"
          tabIndex={-1}
        />
      </div>

      <div className={styles.editFields}>
        <div className={styles.fieldGroup}>
          <input
            className={styles.editInput}
            {...register("title")}
            placeholder="Title"
            aria-label="Playlist title"
          />
          {errors.title && (
            <span className={styles.errorMessage} role="alert">
              {errors.title.message}
            </span>
          )}
        </div>

        <textarea
          className={styles.editTextarea}
          {...register("description")}
          placeholder="Description"
          rows={3}
          aria-label="Playlist description"
        />

        <div className={styles.toggleRow}>
          <span aria-hidden="true">Public</span>
          <button
            type="button"
            role="switch"
            aria-checked={isPublic}
            aria-label="Toggle public visibility"
            className={`${styles.toggle} ${isPublic ? styles.toggleOn : ""}`}
            onClick={() => setValue("is_public", !isPublic)}
          >
            <span className={styles.toggleThumb} />
          </button>

          <span aria-hidden="true">Collaborative</span>
          <button
            type="button"
            role="switch"
            aria-checked={isCollaborative}
            aria-label="Toggle collaborative mode"
            className={`${styles.toggle} ${isCollaborative ? styles.toggleOn : ""}`}
            onClick={() => setValue("is_collaborative", !isCollaborative)}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>

        <div className={styles.editActions}>
          <button
            type="submit"
            className={styles.iconBtn}
            disabled={isSaving || isCoverUploading}
            aria-label="Save playlist changes"
          >
            <IoCheckmarkOutline size={18} aria-hidden="true" />
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={onClose}
            aria-label="Cancel editing"
          >
            <IoCloseOutline size={18} aria-hidden="true" />
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};