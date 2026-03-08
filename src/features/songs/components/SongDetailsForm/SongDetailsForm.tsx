import { useState } from "react";
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
}: SongDetailsFormProps) => {
  const [title, setTitle] = useState(initialValues.title || "");
  const [artist, setArtist] = useState(initialValues.artist || "");
  const [album, setAlbum] = useState(initialValues.album || "");
  const [releaseYear, setReleaseYear] = useState(
    initialValues.releaseYear || "",
  );

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({ title, artist, album, releaseYear });
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Song Details</h3>

      {showMp3Upload && onMp3Upload && (
        <div className={styles.fileUploadWrapper}>
          <label className={styles.uploadLabel}>{mp3Label}</label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => e.target.files && onMp3Upload(e.target.files[0])}
            disabled={mp3Uploading}
          />
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
          <label className={styles.uploadLabel}>
            {coverArtUploading ? "Uploading Cover Art..." : "Select Cover Art"}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              e.target.files && onCoverArtUpload(e.target.files[0])
            }
            disabled={coverArtUploading}
          />
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
