import { useEffect, useRef, useState, type ChangeEvent, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { type UserProfile } from "../../types";
import defaultAvatar from "@/shared/assets/default_avatar.png";
import { Button } from "@/shared/components";
import styles from "./ProfilePage.module.css";
import { PencilSolid } from "@/shared/icons";
import { useCloudinaryUpload } from "@/shared/hooks";
import { updateProfile } from "../../api";

interface ProfilePageProps {
  profile: UserProfile | null;
  isEditing?: boolean;
}

export const ProfilePage = ({ profile, isEditing = false }: ProfilePageProps): JSX.Element => {
  const navigate = useNavigate();

  const [newUsername, setNewUsername] = useState("");
  const [newAvatarUrl, setNewAvatarUrl] = useState("");
  const { upload, isUploading, error: uploadError } = useCloudinaryUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    if (!isEditing) {
      setNewUsername(profile.username ?? "");
      setNewAvatarUrl(profile.avatar_url ?? "");
    }
  }, [isEditing, profile]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleAvatarUpload(file);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const cloudinaryResponse = await upload(file);
      setNewAvatarUrl(cloudinaryResponse.secure_url);
    } catch (err) {
      console.error("New profile avatar upload failed:", err);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      await updateProfile(newUsername || profile.username, newAvatarUrl);
      navigate("/profile");
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setNewUsername(profile.username ?? "");
      setNewAvatarUrl(profile.avatar_url ?? "");
    }
    navigate("/profile");
  };


  if (!profile) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.error}>Profile not found</div>
          <Button variant="outlined" size="large" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const username = profile.username;
  const avatarUrl = profile.avatar_url;
  const displayAvatarUrl = newAvatarUrl || avatarUrl;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            { isEditing && (
              <div
                className={styles.editOverlay}
                onClick={() => fileInputRef.current?.click()}
              >
                <PencilSolid className={styles.editIcon} />
              </div>
            )}
            {isEditing && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            )}
            {displayAvatarUrl ? (
              <img src={displayAvatarUrl} alt="Profile" />
            ) : (
              <img src={defaultAvatar} alt="Default Profile" />
            )}
          </div>
          <h1 className={styles.displayName}>{username}</h1>
          {!isEditing && (
            <Button variant="outlined" size="small" onClick={() => navigate("/profile/edit")}>
              Edit Profile
            </Button>
          )}
        </div>

        <div className={styles.divider}></div>

        <div className={styles.infoSection}>
          <div className={styles.infoLabel}>Username</div>
          {isEditing ?
            (<input className={styles.editInfoValue} placeholder={`${username}`} value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />)
            : (<div className={styles.infoValue}>{username}</div>)}
          <div className={styles.infoLabel}>Email</div>
          <div className={styles.infoValue}>{profile.email}</div>

          <div className={styles.infoLabel}>User ID</div>
          <div className={styles.infoValue}>#{profile.id}</div>
        </div>

        {isEditing ? (
          <div className={styles.editActions}>
            <Button variant="outlined" size="large" onClick={handleSave} disabled={isUploading}>
              Save
            </Button>
            <Button variant="outlined" size="large" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="outlined" size="large" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        )}
        {uploadError && (
          <div className={styles.error}>{String(uploadError)}</div>
        )}
      </div>
    </div>
  );
};
