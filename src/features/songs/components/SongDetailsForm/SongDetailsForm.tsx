import { useId, useState } from "react";
import styles from "../SongUploadForm/SongUploadForm.module.css";
import { AlertMessage } from "@/shared/components/AlertMessage/AlertMessage";

interface SongDetailsFormProps {
  initialValues?: {
    title?: string;
    artist?: string;
    album?: string;
    releaseYear?: string;
  };
  onSubmit: (values: {
    title: string;
    artist: string;
    album: string;
    releaseYear: string;
  }) => void;
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
  error,
  onErrorDismiss,
  showMp3Upload = false,
  onMp3Upload,
  mp3Uploaded = false,
  mp3Uploading = false,
  mp3Label = "Select MP3",
  coverArtUploading = false,
  onCoverArtUpload,
  coverArtLabel = "Select Cover Art",
}: SongDetailsFormProps) => {
  const [title, setTitle] = useState(initialValues.title || "");
  const [artist, setArtist] = useState(initialValues.artist || "");
  const [album, setAlbum] = useState(initialValues.album || "");
  const [releaseYear, setReleaseYear] = useState(
    initialValues.releaseYear || "",
  );
  const [mp3FileName, setMp3FileName] = useState<string>("");
  const [coverFileName, setCoverFileName] = useState<string>("");

  const mp3InputId = useId();
  const coverInputId = useId();

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({ title, artist, album, releaseYear });
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
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

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={styles.inputField}
      />

      <input
        placeholder="Album"
        value={album}
        onChange={(e) => setAlbum(e.target.value)}
        className={styles.inputField}
      />

      <input
        placeholder="Artist"
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        className={styles.inputField}
      />

      <input
        placeholder="Release Year"
        value={releaseYear}
        onChange={(e) => setReleaseYear(e.target.value)}
        className={styles.inputField}
      />

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

      <AlertMessage
        message={error}
        variant="error"
        onDismiss={onErrorDismiss}
      />

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
