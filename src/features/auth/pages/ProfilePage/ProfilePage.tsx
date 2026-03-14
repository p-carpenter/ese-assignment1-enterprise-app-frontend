import { useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button, AlertMessage } from "@/shared/components";
import { useCloudinaryUpload } from "@/shared/hooks";
import { updateProfile } from "../../api";
import { useAuth } from "@/shared/context/AuthContext";
import { AvatarSection } from "./components/AvatarSection/AvatarSection";
import { ProfileInfo } from "./components/ProfileInfo/ProfileInfo";
import styles from "./ProfilePage.module.css";

export const ProfilePage = ({
  isEditing = false,
}: {
  isEditing?: boolean;
}): JSX.Element => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [newUsername, setNewUsername] = useState(user?.username ?? "");
  const [newAvatarUrl, setNewAvatarUrl] = useState(user?.avatar_url ?? "");
  const [passwordChanged, setPasswordChanged] = useState(false);

  const { upload, isUploading, error: uploadError } = useCloudinaryUpload();

  const { mutate: saveProfile, isPending: isSaving, error: saveError } = useMutation({
    mutationFn: () => updateProfile(newUsername, newAvatarUrl),
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      navigate("/profile");
    },
  });

  const handleAvatarChange = async (file: File) => {
    try {
      const res = await upload(file);
      if (res) setNewAvatarUrl(res.secure_url);
    } catch (err) {
      console.error("Avatar upload failed:", err);
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
          <AlertMessage variant="error" message="Profile not found." />
          <Button variant="outlined" size="large" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <AvatarSection
          username={user.username}
          avatarUrl={newAvatarUrl}
          isEditing={isEditing}
          isUploading={isUploading}
          onAvatarChange={handleAvatarChange}
          onEditClick={() => navigate("/profile/edit")}
        />

        <div className={styles.divider} />

        <ProfileInfo
          id={user.id}
          username={newUsername}
          email={user.email}
          isEditing={isEditing}
          onUsernameChange={setNewUsername}
          onPasswordChangeSuccess={() => setPasswordChanged(true)}
        />

        {passwordChanged && (
          <AlertMessage variant="success" message="Password changed successfully." />
        )}
        {uploadError && (
          <AlertMessage variant="error" message={String(uploadError)} />
        )}
        {saveError && (
          <AlertMessage variant="error" message="Failed to save profile. Please try again." />
        )}

        {isEditing ? (
          <div className={styles.editActions}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => saveProfile()}
              disabled={isUploading || isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outlined" size="large" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="outlined" size="large" onClick={() => navigate("/")} className={styles.backButton}>
            Back to Home
          </Button>
        )}
      </div>
    </div>
  );
};