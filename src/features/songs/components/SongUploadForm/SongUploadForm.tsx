import { useState } from "react";
import { useCloudinaryUpload } from "@/shared/hooks/useCloudinaryUpload";
import { SongDetailsForm } from "../SongDetailsForm/SongDetailsForm";
import { uploadSong } from "../../api";
import { useNavigate } from "react-router-dom";

export const SongUploadForm = () => {
  const navigate = useNavigate();

  // Instantiate the hook twice to completely isolate their loading/error states.
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

  // Dedicated state for the database submission
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleCoverArtUpload = async (file: File) => {
    try {
      const cloudData = await uploadCover(file);
      setCoverArtUrl(cloudData.secure_url);
    } catch (err) {
      console.error("Cover art upload failed:", err);
    }
  };

  const handleMp3Upload = async (file: File) => {
    try {
      const cloudData = await uploadMp3(file);
      setSongUrl(cloudData.secure_url);
      setSongDuration(Math.round(cloudData.duration || 0));
      setSongFileName(file.name);
    } catch (err) {
      console.error("MP3 upload failed:", err);
    }
  };

  const handleSubmit = async ({
    title,
    artist,
  }: {
    title: string;
    artist: string;
  }) => {
    if (!songUrl) {
      setSubmitError("Please select an MP3 file.");
      return;
    }

    setSubmitError("");
    setIsSaving(true);

    try {
      await uploadSong({
        title: title || songFileName,
        artist: artist || "Unknown Artist",
        file_url: songUrl,
        cover_art_url: coverArtUrl,
        duration: songDuration,
      });

      navigate("/");
    } catch (err) {
      console.error("Failed to save song:", err);
      setSubmitError("Failed to save song to the database.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Centralized Error Display */}
      {submitError && (
        <div style={{ color: "red", fontWeight: "bold" }}>{submitError}</div>
      )}
      {(mp3Error || coverError) && (
        <div
          style={{
            color: "red",
            padding: "10px",
            backgroundColor: "#ffebee",
            borderRadius: "4px",
          }}
        >
          {mp3Error && <div>MP3 Upload Error: {mp3Error}</div>}
          {coverError && <div>Cover Art Error: {coverError}</div>}
        </div>
      )}

      <SongDetailsForm
        initialValues={{ title: "", artist: "" }}
        onSubmit={handleSubmit}
        isSubmitting={isSaving}
        error={submitError}
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
