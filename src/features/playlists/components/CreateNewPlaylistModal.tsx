import { Modal } from "@/shared/components/Modal/Modal";
import { createPlaylist } from "../api";
import { CreateNewPlaylistForm } from "./CreateNewPlaylistForm/CreateNewPlaylistForm";

interface CreateNewPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistCreated: () => void;
}

export const CreateNewPlaylistModal = ({
  isOpen,
  onClose,
  onPlaylistCreated,
}: CreateNewPlaylistModalProps) => {
  if (!isOpen) return null;

  const handleSubmit = async ({
    title,
    description,
    is_public,
  }: {
    title: string;
    description: string;
    is_public: boolean;
  }) => {
    try {
      await createPlaylist({
        title,
        description,
        is_public,
      });
      onPlaylistCreated();
      onClose();
    } catch (err) {
      console.error("Failed to create playlist:", err);
      alert("Failed to create playlist. Check console.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a New Playlist">
      <CreateNewPlaylistForm onSubmit={handleSubmit} />
    </Modal>
  );
};
