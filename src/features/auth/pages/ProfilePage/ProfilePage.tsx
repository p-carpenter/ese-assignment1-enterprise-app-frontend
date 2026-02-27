import { useRef, useState, type ChangeEvent, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "@/shared/assets/default_avatar.png";
import { Button } from "@/shared/components";
import styles from "./ProfilePage.module.css";
import { PencilSolid } from "@/shared/icons";
import { useCloudinaryUpload } from "@/shared/hooks";
import { updateProfile } from "../../api";
import { useAuth } from "@/shared/context/AuthContext";

export const ProfilePage = ({ isEditing = false }: { isEditing?: boolean }): JSX.Element => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [newUsername, setNewUsername] = useState(user?.username ?? "");
  const [newAvatarUrl, setNewAvatarUrl] = useState(user?.avatar_url ?? "");

  const { upload, isUploading, error: uploadError } = useCloudinaryUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const cloudinaryResponse = await upload(file);
        setNewAvatarUrl(cloudinaryResponse.secure_url);
      } catch (err) {
        console.error("New profile avatar upload failed:", err);
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const updatedUser = await updateProfile(newUsername, newAvatarUrl);
      setUser(updatedUser);
      navigate("/profile");
    } catch (err) {
      console.error("Failed to update profile:", err);
    }
  };

  const handleCancel = () => {
    setNewUsername(user?.username ?? "");
    setNewAvatarUrl(user?.avatar_url ?? "");
    navigate("/profile");
  };

  if (!user) {
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

  const displayAvatarUrl = newAvatarUrl || user.avatar_url;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            {isEditing && (
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
          <h1 className={styles.displayName}>{user.username}</h1>
          {!isEditing && (
            <Button variant="outlined" size="small" onClick={() => navigate("/profile/edit")}>
              Edit Profile
            </Button>
          )}
        </div>

        <div className={styles.divider}></div>

        <div className={styles.infoSection}>
          <div className={styles.infoLabel}>Username</div>
          {isEditing ? (
            <input
              className={styles.editInfoValue}
              placeholder={user.username}
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
          ) : (
            <div className={styles.infoValue}>{user.username}</div>
          )}
          <div className={styles.infoLabel}>Email</div>
          <div className={styles.infoValue}>{user.email}</div>

          <div className={styles.infoLabel}>User ID</div>
          <div className={styles.infoValue}>#{user.id}</div>
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
        {uploadError && <div className={styles.error}>{String(uploadError)}</div>}
      </div>
    </div>
  );
};