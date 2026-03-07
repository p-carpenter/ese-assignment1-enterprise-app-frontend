import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/shared/components/Modal/Modal";
import { createPlaylist } from "../api";
import { CreateNewPlaylistForm } from "./CreateNewPlaylistForm/CreateNewPlaylistForm";
import { queryKeys } from "@/shared/lib/queryKeys";

interface CreateNewPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateNewPlaylistModal = ({
  isOpen,
  onClose,
}: CreateNewPlaylistModalProps) => {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (values: {
      title: string;
      description: string;
      cover_art_url: string;
      is_collaborative: boolean;
      is_public: boolean;
    }) => createPlaylist(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
      onClose();
    },
    onError: () => {
      setFormError("Failed to create playlist. Please try again.");
    },
  });

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a New Playlist">
      <CreateNewPlaylistForm
        onSubmit={(values) => {
          setFormError(null);
          createMutation.mutate(values);
        }}
        isSubmitting={createMutation.isPending}
        error={formError}
      />
    </Modal>
  );
};
