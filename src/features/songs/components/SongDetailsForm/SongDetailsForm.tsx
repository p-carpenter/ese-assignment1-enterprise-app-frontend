import { useId, useEffect, useState, useRef } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
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
  uploadedCoverUrl?: string;
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
  uploadedCoverUrl,
}: SongDetailsFormProps) => {
  const [mp3FileName, setMp3FileName] = useState<string>("");
  const mp3InputId = useId();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<SongDetailsValues>({
    resolver: zodResolver(songDetailsSchema) as Resolver<SongDetailsValues>,
    defaultValues: {
      title: initialValues.title || "",
      artist: initialValues.artist || "",
      album: initialValues.album || "",
      release_year: initialValues.release_year ?? undefined,
      cover_art_url: initialValues.cover_art_url || "",
    },
  });

  const formCoverUrl = useWatch({ control, name: "cover_art_url" });

  // Sync incoming ID3 tags.
  useEffect(() => {
    reset(
      {
        title: initialValues.title || "",
        artist: initialValues.artist || "",
        album: initialValues.album || "",
        release_year: initialValues.release_year ?? undefined,
        cover_art_url: initialValues.cover_art_url || "",
      },
      { keepDirtyValues: true },
    );
  }, [
    initialValues.title,
    initialValues.artist,
    initialValues.album,
    initialValues.release_year,
    initialValues.cover_art_url,
    reset,
  ]);

  // Sync the uploaded cover URL from the parent into the form state.
  useEffect(() => {
    if (uploadedCoverUrl) {
      setValue("cover_art_url", uploadedCoverUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [uploadedCoverUrl, setValue]);

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

      {onCoverArtUpload && (
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
            src={formCoverUrl || "https://placehold.co/220"}
            alt="Song cover preview"
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
            disabled={coverArtUploading}
            style={{ cursor: "pointer" }}
          >
            {coverArtUploading ? "Uploading…" : "Change Cover Art"}
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => {
              if (!e.target.files) return;
              onCoverArtUpload(e.target.files[0]);
            }}
            aria-label="Upload Cover Art"
            tabIndex={-1}
          />
        </div>
      )}

      <div className={styles.inputGroup}>
        <input
          placeholder="Title"
          aria-label="Title"
          className={styles.inputField}
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
          placeholder="Artist"
          aria-label="Artist"
          className={styles.inputField}
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
          placeholder="Album"
          aria-label="Album"
          className={styles.inputField}
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
          placeholder="Release Year"
          aria-label="Release Year"
          className={styles.inputField}
          {...register("release_year")}
        />
        {errors.release_year && (
          <span className={styles.errorText} role="alert">
            {errors.release_year.message}
          </span>
        )}
      </div>

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
