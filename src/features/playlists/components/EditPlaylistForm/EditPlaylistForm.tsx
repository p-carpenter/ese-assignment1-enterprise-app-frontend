import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePlaylist } from "@/features/playlists/api";
import { useCloudinaryUpload } from "@/shared/hooks";
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

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<EditPlaylistFormValues>({
    resolver: zodResolver(editPlaylistSchema),
    defaultValues: {
      title: playlist.title,
      description: playlist.description ?? "",
      is_public: playlist.is_public,
      is_collaborative: playlist.is_collaborative,
      cover_art_url: playlist.cover_art_url ?? "https://placehold.co/220",
    },
  });

  const isPublic = useWatch({ control, name: "is_public" });
  const isCollaborative = useWatch({ control, name: "is_collaborative" });
  const coverUrl = useWatch({ control, name: "cover_art_url" });

  const { upload: uploadCover, isUploading: isCoverUploading } =
    useCloudinaryUpload();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await uploadCover(file);
    if (res) {
      setValue("cover_art_url", res.secure_url, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const {
    mutate: saveEdit,
    isPending: isSaving,
    error: saveError,
  } = useMutation({
    mutationFn: (payload: Partial<EditPlaylistFormValues>) =>
      updatePlaylist(playlist.id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.playlist(playlist.id),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
      onClose();
    },
  });

  // Intercept the submission to filter out untouched fields
  const onFormSubmit = (data: EditPlaylistFormValues) => {
    const payload = Object.keys(dirtyFields).reduce((acc, key) => {
      const k = key as keyof EditPlaylistFormValues;

      (acc as Record<string, unknown>)[k] = data[k];

      return acc;
    }, {} as Partial<EditPlaylistFormValues>);

    // If no fields were changed, close the form without making an API call.
    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }
    setSubmitError(null);
    setIsSubmittingLocal(true);

    saveEdit(payload as Partial<EditPlaylistFormValues>, {
      onError: (err: unknown) => {
        setSubmitError(
          err instanceof ApiError
            ? err.getReadableMessage()
            : err instanceof Error
              ? err.message
              : "An unexpected error occurred.",
        );
      },
      onSettled: () => {
        setIsSubmittingLocal(false);
      },
    });
  };

  const editErrorMessage =
    submitError ??
    (saveError instanceof ApiError
      ? saveError.getReadableMessage()
      : saveError?.message) ??
    "An unexpected error occurred.";

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      {(saveError || submitError) && (
        <AlertMessage message={editErrorMessage} />
      )}

      <div className={styles.editFormRow}>
        <div className={styles.coverWrap}>
          <img
            src={coverUrl || "https://placehold.co/220"}
            alt="Playlist cover art"
            className={styles.coverArt}
          />
          <button
            type="button"
            className={styles.coverEditBtn}
            onClick={() => coverInputRef.current?.click()}
            disabled={isCoverUploading}
            aria-label={
              isCoverUploading
                ? "Uploading cover image"
                : "Change playlist cover"
            }
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
              onClick={() => {
                const nextIsPublic = !isPublic;
                setValue("is_public", nextIsPublic, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                if (!nextIsPublic) {
                  setValue("is_collaborative", false, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }
              }}
            >
              <span className={styles.toggleThumb} />
            </button>

            {isPublic && (
              <>
                <span aria-hidden="true">Collaborative</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isCollaborative}
                  aria-label="Toggle collaborative mode"
                  className={`${styles.toggle} ${isCollaborative ? styles.toggleOn : ""}`}
                  onClick={() =>
                    setValue("is_collaborative", !isCollaborative, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  <span className={styles.toggleThumb} />
                </button>
              </>
            )}
          </div>

          {errors.is_collaborative && (
            <span className={styles.errorMessage} role="alert">
              {errors.is_collaborative.message}
            </span>
          )}

          <div className={styles.editActions}>
            <button
              type="submit"
              className={styles.iconBtn}
              disabled={isSaving || isSubmittingLocal || isCoverUploading}
              aria-label="Save playlist changes"
            >
              <IoCheckmarkOutline size={18} aria-hidden="true" />
              {isSaving || isSubmittingLocal ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => {
                reset({
                  title: playlist.title,
                  description: playlist.description ?? "",
                  is_public: playlist.is_public,
                  is_collaborative: playlist.is_collaborative,
                  cover_art_url: playlist.cover_art_url ?? "",
                });
                onClose();
              }}
              aria-label="Cancel editing"
            >
              <IoCloseOutline size={18} aria-hidden="true" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
