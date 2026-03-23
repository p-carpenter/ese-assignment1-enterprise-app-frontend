import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCloudinaryUpload } from "@/shared/hooks";
import { readId3Tags, type Id3Tags } from "@/shared/hooks/useId3Tags";
import { SongDetailsForm } from "../SongDetailsForm/SongDetailsForm";
import { type SongDetailsValues } from "../SongDetailsForm/schema";
import { uploadSong } from "../../api";
import { useNavigate } from "react-router-dom";
import styles from "./SongUploadForm.module.css";
import { AlertMessage } from "@/shared/components";
import { ApiError } from "@/shared/api/errors";
import { queryKeys } from "@/shared/lib/queryKeys";

export const SongUploadForm = () => {
  /**
   * Composite form that handles MP3 and cover uploads, ID3 extraction and final song creation.
   * Delegates metadata entry to `SongDetailsForm` and coordinates Cloudinary uploads.
   */
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    upload: uploadMp3,
    isUploading: isMp3Uploading,
    error: mp3Error,
  } = useCloudinaryUpload();
  const {
    upload: uploadCover,
    isUploading: isCoverUploading,
    error: coverError,
  } = useCloudinaryUpload();

  const [songUrl, setSongUrl] = useState<string>("");
  const [songDuration, setSongDuration] = useState<number>(0);
  const [coverArtUrl, setCoverArtUrl] = useState<string>("");
  const [songFileName, setSongFileName] = useState<string>("");
  const [id3Tags, setId3Tags] = useState<Id3Tags>({});

  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleCoverArtUpload = async (file: File | null) => {
    /**
     * Upload a cover art image and set the resulting URL on success.
     * @param file - The selected image file or null.
     */
    if (!file) return;
    try {
      const cloudData = await uploadCover(file);
      if (cloudData) {
        setCoverArtUrl(cloudData.secure_url);
      }
    } catch (err) {
      console.error("Cover art upload failed:", err);
    }
  };

  const handleMp3Upload = async (file: File | null) => {
    /**
     * Process and upload an MP3 file: read ID3 tags, upload to Cloudinary and set state.
     * @param file - The MP3 file selected by the user, or null.
     */
    if (!file) return;

    try {
      const tags = await readId3Tags(file);
      setId3Tags(tags);
      setSongFileName(file.name);

      const cloudData = await uploadMp3(file);
      if (cloudData) {
        setSongUrl(cloudData.secure_url);
        setSongDuration(Math.round(cloudData.duration || 0));
      }
    } catch (err) {
      console.error("MP3 processing or upload failed:", err);
    }
  };

  const handleSubmit = async (data: SongDetailsValues) => {
    /**
     * Finalise and submit song metadata and uploaded assets to create a new song record.
     * @param data - Values from the song details form.
     */
    if (!songUrl) {
      setSubmitError("Please select an MP3 file.");
      return;
    }

    setSubmitError("");
    setIsSaving(true);

    try {
      let releaseYear = data.release_year;

      // if the user didn't manually enter a year, try to extract it from the mp3 tags.
      if (!releaseYear && id3Tags.year) {
        const parsedYear = Number(id3Tags.year);
        if (!isNaN(parsedYear) && parsedYear > 0) {
          releaseYear = parsedYear;
        }
      }

      await uploadSong({
        title: data.title || id3Tags.title || songFileName,
        artist: data.artist || id3Tags.artist || "Unknown Artist",
        file_url: songUrl,
        cover_art_url: data.cover_art_url || coverArtUrl,
        duration: songDuration,
        album: data.album || id3Tags.album || "Unknown Album",
        release_year: releaseYear,
      });

      void queryClient.invalidateQueries({ queryKey: queryKeys.allSongs });
      navigate("/");
    } catch (err) {
      console.error("Failed to save song:", err);
      setSubmitError(
        err instanceof ApiError
          ? err.getReadableMessage("Failed to save song to the database.")
          : "Failed to save song to the database.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.errorContainer}>
      <AlertMessage
        message={submitError}
        onDismiss={() => setSubmitError("")}
      />
      <AlertMessage
        message={
          mp3Error || coverError
            ? [
                mp3Error && `MP3 Upload Error: ${mp3Error}`,
                coverError && `Cover Art Error: ${coverError}`,
              ]
                .filter(Boolean)
                .join(" ")
            : null
        }
      />

      <SongDetailsForm
        initialValues={{
          title: id3Tags.title || "",
          artist: id3Tags.artist || "",
          album: id3Tags.album || "",
          release_year: id3Tags.year || undefined,
        }}
        onSubmit={handleSubmit}
        isSubmitting={isSaving}
        showMp3Upload={true}
        onMp3Upload={handleMp3Upload}
        mp3Uploaded={!!songUrl}
        mp3Uploading={isMp3Uploading}
        mp3Label={isMp3Uploading ? "Uploading MP3..." : "Select MP3"}
        coverArtUploading={isCoverUploading}
        onCoverArtUpload={handleCoverArtUpload}
        uploadedCoverUrl={coverArtUrl}
      />
    </div>
  );
};
