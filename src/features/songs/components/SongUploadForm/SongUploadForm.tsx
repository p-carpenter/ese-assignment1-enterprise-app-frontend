import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCloudinaryUpload } from "@/shared/hooks/useCloudinaryUpload";
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
    if (!file) return;
    try {
      const [cloudData, tags] = await Promise.all([
        uploadMp3(file),
        readId3Tags(file),
      ]);
      if (cloudData) {
        setSongUrl(cloudData.secure_url);
        setSongDuration(Math.round(cloudData.duration || 0));
        setSongFileName(file.name);
      }
      setId3Tags(tags);
    } catch (err) {
      console.error("MP3 upload failed:", err);
    }
  };

  const handleSubmit = async (data: SongDetailsValues) => {
    if (!songUrl) {
      setSubmitError("Please select an MP3 file.");
      return;
    }

    setSubmitError("");
    setIsSaving(true);

    try {
      await uploadSong({
        title: data.title || id3Tags.title || songFileName,
        artist: data.artist || id3Tags.artist || "Unknown Artist",
        file_url: songUrl,
        cover_art_url: coverArtUrl,
        duration: songDuration,
        album: data.album || id3Tags.album || "Unknown Album",
        release_year: data.releaseYear || id3Tags.year || "Unknown Year",
      });

      void queryClient.invalidateQueries({ queryKey: queryKeys.allSongs });
      navigate("/");
    } catch (err) {
      console.error("Failed to save song:", err);
      setSubmitError(
        err instanceof ApiError
          ? err.getReadableMessage("Failed to save song to the database.")
          : err instanceof Error
            ? err.message
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
          releaseYear: id3Tags.year || "",
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
      />
    </div>
  );
};
