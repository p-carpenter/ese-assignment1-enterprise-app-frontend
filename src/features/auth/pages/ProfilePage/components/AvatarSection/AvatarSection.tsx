import { useRef, type ChangeEvent } from "react";
import defaultAvatar from "@/shared/assets/default_avatar.png";
import { PencilSolid } from "@/shared/icons";
import styles from "./AvatarSection.module.css";
import { LinkButton } from "@/shared/components/Button/LinkButton";

interface AvatarSectionProps {
  username: string;
  avatarUrl: string;
  isEditing: boolean;
  isUploading: boolean;
  onAvatarChange: (file: File) => void;
}

/**
 * Avatar and display-name section used on the profile page.
 * Supports in-place avatar uploads when `isEditing` is enabled.
 * @param props `AvatarSectionProps` containing avatar data and callbacks.
 * @returns Avatar section element.
 */
export const AvatarSection = ({
  username,
  avatarUrl,
  isEditing,
  isUploading,
  onAvatarChange,
}: AvatarSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAvatarChange(file);
  };

  return (
    <div className={styles.avatarSection}>
      <div className={styles.avatarWrapper}>
        <div
          className={`${styles.avatar} ${isEditing ? styles.avatarEditing : ""}`}
        >
          {isEditing && (
            <>
              <div
                className={styles.editOverlay}
                data-testid="edit-overlay"
                onClick={() => fileInputRef.current?.click()}
              >
                <PencilSolid className={styles.editIcon} />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </>
          )}
          <img src={avatarUrl || defaultAvatar} alt="Profile" />
        </div>
        {isEditing && (
          <div
            className={styles.editBadge}
            data-testid="edit-badge"
            onClick={() => fileInputRef.current?.click()}
          >
            <PencilSolid />
          </div>
        )}
      </div>

      <h1 className={styles.displayName}>{username}</h1>

      {!isEditing && (
        <LinkButton to="/profile/edit" variant="outlined" size="small">
          Edit Profile
        </LinkButton>
      )}

      {isUploading && (
        <p className={styles.uploadingText}>Uploading avatar...</p>
      )}
    </div>
  );
};
