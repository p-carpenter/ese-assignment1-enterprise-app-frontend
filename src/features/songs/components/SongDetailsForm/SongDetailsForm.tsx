import { useId, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import styles from "./SongDetailsForm.module.css";
import { type SongDetailsValues, songDetailsSchema } from "./schema";

interface SongDetailsFormProps {
  initialValues?: Partial<SongDetailsValues>;
  onSubmit: (values: SongDetailsValues) => void;
  isSubmitting?: boolean;
  error?: string | null;
  onErrorDismiss?: () => void;
  showMp3Upload?: boolean;
  onMp3Upload?: (file: File) => void;
  mp3Uploaded?: boolean;
  mp3Uploading?: boolean;
  mp3Label?: string;
  coverArtUploading?: boolean;
  onCoverArtUpload?: (file: File) => void;
  coverArtLabel?: string;
}

export const SongDetailsForm = ({
  initialValues = {},
  onSubmit,
  isSubmitting = false,
  showMp3Upload = false,
  onMp3Upload,
  mp3Uploaded = false,
  mp3Uploading = false,
  mp3Label = "Select MP3",
  coverArtUploading = false,
  onCoverArtUpload,
  coverArtLabel = "Select Cover Art",
}: SongDetailsFormProps) => {
  const [mp3FileName, setMp3FileName] = useState<string>("");
  const [coverFileName, setCoverFileName] = useState<string>("");

  const mp3InputId = useId();
  const coverInputId = useId();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SongDetailsValues>({
    resolver: zodResolver(songDetailsSchema),
    defaultValues: {
      title: initialValues.title || "",
      artist: initialValues.artist || "",
      album: initialValues.album || "",
      releaseYear: initialValues.releaseYear || "",
    },
  });

  // Sync incoming ID3 tags.
  useEffect(() => {
    reset({
      title: initialValues.title || "",
      artist: initialValues.artist || "",
      album: initialValues.album || "",
      releaseYear: initialValues.releaseYear || "",
    });
  }, [
    initialValues.title,
    initialValues.artist,
    initialValues.album,
    initialValues.releaseYear,
    reset,
  ]);

  return (
    <form className={styles.container} onSubmit={handleSubmit(onSubmit)}>
      <h3 className={styles.title}>Song Details</h3>

      {showMp3Upload && onMp3Upload && (
        <div className={styles.fileUploadWrapper}>
          <label
            htmlFor={mp3InputId}
            className={`${styles.uploadLabel} ${mp3Uploading ? styles.uploading : ""}`}
          >
            {mp3Uploading
              ? "Uploading…"
              : mp3Uploaded
                ? "✓ Change MP3"
                : mp3Label}
          </label>
          <input
            id={mp3InputId}
            type="file"
            accept="audio/*"
            className={styles.fileInput}
            disabled={mp3Uploading}
            onChange={(e) => {
              if (!e.target.files) return;
              const file = e.target.files[0];
              setMp3FileName(file.name);
              onMp3Upload(file);
            }}
          />
          {mp3FileName && !mp3Uploading && (
            <span
              className={`${styles.fileStatusText} ${mp3Uploaded ? styles.ready : ""}`}
            >
              {mp3Uploaded ? `✓ ${mp3FileName}` : mp3FileName}
            </span>
          )}
          {!mp3FileName && mp3Uploaded && (
            <span className={`${styles.fileStatusText} ${styles.ready}`}>
              ✓ Audio file ready
            </span>
          )}
        </div>
      )}

      <div className={styles.inputGroup}>
        <input
          placeholder="Title"
          className={styles.inputField}
          {...register("title")}
        />
        {errors.title && (
          <span className={styles.errorText}>{errors.title.message}</span>
        )}
      </div>

      <div className={styles.inputGroup}>
        <input
          placeholder="Artist"
          className={styles.inputField}
          {...register("artist")}
        />
        {errors.artist && (
          <span className={styles.errorText}>{errors.artist.message}</span>
        )}
      </div>

      <div className={styles.inputGroup}>
        <input
          placeholder="Album"
          className={styles.inputField}
          {...register("album")}
        />
        {errors.album && (
          <span className={styles.errorText}>{errors.album.message}</span>
        )}
      </div>

      <div className={styles.inputGroup}>
        <input
          placeholder="Release Year"
          className={styles.inputField}
          {...register("releaseYear")}
        />
        {errors.releaseYear && (
          <span className={styles.errorText}>{errors.releaseYear.message}</span>
        )}
      </div>

      {onCoverArtUpload && (
        <div className={styles.fileUploadWrapper}>
          <label
            htmlFor={coverInputId}
            className={`${styles.uploadLabel} ${coverArtUploading ? styles.uploading : ""}`}
          >
            {coverArtUploading
              ? "Uploading…"
              : coverFileName
                ? "✓ Change Cover"
                : coverArtLabel}
          </label>
          <input
            id={coverInputId}
            type="file"
            accept="image/*"
            className={styles.fileInput}
            disabled={coverArtUploading}
            onChange={(e) => {
              if (!e.target.files) return;
              const file = e.target.files[0];
              setCoverFileName(file.name);
              onCoverArtUpload(file);
            }}
          />
          {coverFileName && !coverArtUploading && (
            <span className={`${styles.fileStatusText} ${styles.ready}`}>
              ✓ {coverFileName}
            </span>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || (showMp3Upload && !mp3Uploaded)}
        className={styles.submitButton}
      >
        {isSubmitting ? "Saving..." : "Save Song"}
      </button>
    </form>
  );
};
