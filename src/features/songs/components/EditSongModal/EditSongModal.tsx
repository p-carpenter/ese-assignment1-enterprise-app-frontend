import { useState, type JSX } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/shared/components/Modal/Modal";
import { SongDetailsForm } from "../SongDetailsForm/SongDetailsForm";
import { type SongDetailsValues } from "../SongDetailsForm/schema";
import { useCloudinaryUpload } from "@/shared/hooks/useCloudinaryUpload";
import { type Song } from "../../types";
import { updateSong } from "../../api";
import { ApiError } from "@/shared/api/errors";
import { queryKeys } from "@/shared/lib/queryKeys";

interface EditSongModalProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
  onSongUpdated: () => void;
}

export const EditSongModal = ({
  song,
  isOpen,
  onClose,
  onSongUpdated,
}: EditSongModalProps): JSX.Element | null => {
  const queryClient = useQueryClient();
  const { upload, isUploading, error: uploadError } = useCloudinaryUpload();

  const [coverArtUrl, setCoverArtUrl] = useState<string>(
    song?.cover_art_url || "",
  );

  const updateMutation = useMutation({
    mutationFn: ({
      title,
      artist,
      url,
    }: {
      title: string;
      artist: string;
      url: string;
    }) =>
      updateSong(song!.id, {
        title,
        artist,
        file_url: song!.file_url,
        duration: song!.duration,
        cover_art_url: url,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.allSongs });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.song(song!.id),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
      onSongUpdated();
      onClose();
    },
  });

  if (!song) return null;

  const handleCoverArtUpload = async (file: File) => {
    try {
      const cloudData = await upload(file);
      if (cloudData) {
        setCoverArtUrl(cloudData.secure_url);
      }
    } catch (err) {
      console.error("Cover art upload failed:", err);
    }
  };

  const handleSubmit = ({ title, artist }: SongDetailsValues) => {
    updateMutation.mutate({ title, artist, url: coverArtUrl });
  };

  const activeError = updateMutation.error || uploadError;
  const errorMessage =
    activeError instanceof ApiError
      ? activeError.getReadableMessage()
      : (activeError as Error)?.message ||
        (typeof activeError === "string" ? activeError : null);

  const handleDismissError = () => {
    if (updateMutation.error) updateMutation.reset();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Song">
      <SongDetailsForm
        initialValues={{
          title: song.title,
          artist: song.artist,
        }}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending || isUploading}
        error={errorMessage}
        onErrorDismiss={handleDismissError}
        showMp3Upload={false}
        coverArtUploading={isUploading}
        onCoverArtUpload={handleCoverArtUpload}
      />
    </Modal>
  );
};
