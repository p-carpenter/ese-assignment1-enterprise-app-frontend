import { useState } from "react";
import styles from "../SongUploadForm/SongUploadForm.module.css";

interface SongDetailsFormProps {
  initialValues?: { title?: string; artist?: string };
  onSubmit: (values: { title: string; artist: string }) => void;
  isSubmitting?: boolean;
  error?: string | null;
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
  showMp3Upload = false,
  onMp3Upload,
  mp3Uploaded = false,
  mp3Uploading = false,
  mp3Label = "Select MP3",
  coverArtUploading = false,
  onCoverArtUpload,
}: SongDetailsFormProps) => {
  // Only track the text inputs that the user actually types into
  const [title, setTitle] = useState(initialValues.title || "");
  const [artist, setArtist] = useState(initialValues.artist || "");

  const handleSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Stop passing the URLs back. The parent already has them.
    onSubmit({ title, artist });
  };

  return (
    <form className={styles.container} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Song Details</h3>

      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={styles.inputField}
      />

      <input
        placeholder="Artist"
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
        className={styles.inputField}
      />

      {/* Cover Art Upload */}
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

      {/* MP3 Upload */}
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

      {mp3Uploaded && <p className={styles.success}>✓ Audio file ready</p>}

      {error && <div className={styles.error}>{error}</div>}

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
