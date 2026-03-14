import { useRef, type ChangeEvent } from "react";
import defaultAvatar from "@/shared/assets/default_avatar.png";
import { Button } from "@/shared/components";
import { PencilSolid } from "@/shared/icons";
import styles from "./AvatarSection.module.css";

interface AvatarSectionProps {
    username: string;
    avatarUrl: string;
    isEditing: boolean;
    isUploading: boolean;
    onAvatarChange: (file: File) => void;
    onEditClick: () => void;
}

export const AvatarSection = ({
    username,
    avatarUrl,
    isEditing,
    isUploading,
    onAvatarChange,
    onEditClick,
}: AvatarSectionProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onAvatarChange(file);
    };

    return (
        <div className={styles.avatarSection}>
            <div
                className={styles.avatar}
            >
                {isEditing && (
                    <>
                        <div
                            className={styles.editOverlay}
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

            <h1 className={styles.displayName}>{username}</h1>

            {!isEditing && (
                <Button variant="outlined" size="small" onClick={onEditClick}>
                    Edit Profile
                </Button>
            )}

            {isUploading && (
                <p className={styles.uploadingText}>Uploading avatar...</p>
            )}
        </div>
    );
};