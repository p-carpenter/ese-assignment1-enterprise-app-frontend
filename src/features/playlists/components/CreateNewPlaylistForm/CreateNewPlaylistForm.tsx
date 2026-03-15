import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { playlistSchema, type PlaylistFormValues } from "./schema";
import styles from "@/features/songs/components/SongUploadForm/SongUploadForm.module.css";
import { useCloudinaryUpload } from "@/shared/hooks/useCloudinaryUpload";
import { AlertMessage } from "@/shared/components";

interface CreateNewPlaylistFormProps {
  onSubmit: (values: {
    title: string;
    description: string;
    is_public: boolean;
    cover_art_url: string;
    is_collaborative: boolean;
  }) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

export const CreateNewPlaylistForm = ({
  onSubmit,
  isSubmitting = false,
  error,
}: CreateNewPlaylistFormProps) => {
  const [coverArtUrl, setCoverArtUrl] = useState<string>("");
  const [coverFileName, setCoverFileName] = useState<string>("");

  const {
    upload: uploadCover,
    isUploading: isCoverUploading,
    error: coverError,
  } = useCloudinaryUpload();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PlaylistFormValues>({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      title: "",
      description: "",
      is_public: true,
      is_collaborative: false,
    },
  });

  const onFormSubmit = (data: PlaylistFormValues) => {
    onSubmit({
      title: data.title,
      description: data.description || "",
      is_public: data.is_public,
      is_collaborative: data.is_collaborative,
      cover_art_url: coverArtUrl,
    });
  };

  const handleCoverArtUpload = async (file: File | null) => {
    if (!file) return;
    setCoverFileName(file.name);
    try {
      const cloudData = await uploadCover(file);
      if (cloudData) {
        setCoverArtUrl(cloudData.secure_url);
      }
    } catch (err) {
      console.error("Cover art upload failed:", err);
      setCoverFileName("");
    }
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit(onFormSubmit)}>
      <h3 className={styles.title}>Playlist Details</h3>
      <AlertMessage message={error} />
      <AlertMessage message={coverError ? `Cover Art Error: ${coverError}` : null} />

      <div className={styles.fileUploadWrapper}>
        <label
          className={`${styles.uploadLabel} ${isCoverUploading ? styles.uploading : ""}`}
        >
          {isCoverUploading
            ? "Uploading…"
            : coverFileName
              ? "✓ Change Cover"
              : "Upload Cover Art"}
          <input
            aria-label="Upload Cover Art"
            type="file"
            accept="image/*"
            className={styles.fileInput}
            disabled={isCoverUploading}
            onChange={(e) => handleCoverArtUpload(e.target.files?.[0] || null)}
          />
        </label>
        {coverFileName && !isCoverUploading && (
          <span className={`${styles.fileStatusText} ${styles.ready}`}>
            ✓ {coverFileName}
          </span>
        )}
      </div>

      <div className={styles.inputGroup}>
        <input
          aria-label="Title"
          placeholder="Playlist Name"
          className={styles.inputField}
          {...register("title")}
        />
        {errors.title && <span className={styles.errorText}>{errors.title.message}</span>}
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
          {...register("is_public")}
        />
        <label htmlFor="is_public" className={styles.checkboxLabel}>
          Public
        </label>
      </div>

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