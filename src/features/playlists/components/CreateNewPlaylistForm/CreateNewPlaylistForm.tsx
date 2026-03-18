import { useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { playlistSchema, type PlaylistFormValues } from "./schema";
import styles from "@/features/songs/components/SongUploadForm/SongUploadForm.module.css";
import { useCloudinaryUpload } from "@/shared/hooks/useCloudinaryUpload";
import { AlertMessage } from "@/shared/components";

interface CreateNewPlaylistFormProps {
  onSubmit: (values: PlaylistFormValues) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export const CreateNewPlaylistForm = ({
  onSubmit,
  isSubmitting = false,
  error,
}: CreateNewPlaylistFormProps) => {
  const coverInputRef = useRef<HTMLInputElement>(null);

  const {
    upload: uploadCover,
    isUploading: isCoverUploading,
    error: coverError,
  } = useCloudinaryUpload();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<PlaylistFormValues>({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      title: "",
      description: "",
      is_public: false,
      is_collaborative: false,
      cover_art_url: "",
    },
  });

  // Watch the form state directly.
  const isPublic = useWatch({ control, name: "is_public" });
  const coverUrl = useWatch({ control, name: "cover_art_url" });

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const cloudData = await uploadCover(file);
      if (cloudData) {
        setValue("cover_art_url", cloudData.secure_url, { shouldDirty: true });
      }
    } catch (err) {
      console.error("Cover art upload failed:", err);
    }
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit(onSubmit)}>
      <h3 className={styles.title}>Playlist Details</h3>
      <AlertMessage message={error} />
      <AlertMessage
        message={coverError ? `Cover Art Error: ${coverError}` : null}
      />

      <div
        className={styles.fileUploadWrapper}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <img
          src={coverUrl || "https://placehold.co/220"}
          alt="Playlist cover preview"
          style={{
            width: "150px",
            height: "150px",
            objectFit: "cover",
            borderRadius: "8px",
          }}
        />
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          disabled={isCoverUploading}
          style={{ cursor: "pointer" }}
        >
          {isCoverUploading ? "Uploading…" : "Upload Cover Art"}
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleCoverChange}
          aria-label="Upload Cover Art"
          tabIndex={-1}
        />
      </div>

      <div className={styles.inputGroup}>
        <input
          aria-label="Title"
          placeholder="Playlist Name"
          className={styles.inputField}
          {...register("title")}
        />
        {errors.title && (
          <span className={styles.errorText}>{errors.title.message}</span>
        )}
      </div>

      <div className={styles.inputGroup}>
        <input
          aria-label="Description"
          placeholder="Playlist Description"
          className={styles.inputField}
          {...register("description")}
        />
        {errors.description && (
          <span className={styles.errorText}>{errors.description.message}</span>
        )}
      </div>

      <div className={styles.checkboxContainer}>
        <input
          type="checkbox"
          id="is_public"
          className={styles.checkbox}
          {...register("is_public", {
            onChange: (e) => {
              // Force collaborative off if public is unchecked.
              if (!e.target.checked) {
                setValue("is_collaborative", false, { shouldValidate: true });
              }
            },
          })}
        />
        <label htmlFor="is_public" className={styles.checkboxLabel}>
          Public
        </label>
      </div>

      {isPublic && (
        <div className={styles.checkboxContainer}>
          <input
            type="checkbox"
            id="is_collaborative"
            className={styles.checkbox}
            {...register("is_collaborative")}
          />
          <label htmlFor="is_collaborative" className={styles.checkboxLabel}>
            Collaborative
          </label>
        </div>
      )}

      {errors.is_collaborative && (
        <span className={styles.errorText}>
          {errors.is_collaborative.message}
        </span>
      )}

      <button
        type="submit"
        disabled={isSubmitting || isCoverUploading}
        className={styles.submitButton}
      >
        {isSubmitting ? "Creating..." : "Create Playlist"}
      </button>
    </form>
  );
};
