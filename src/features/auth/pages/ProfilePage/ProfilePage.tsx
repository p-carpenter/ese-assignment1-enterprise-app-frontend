import { useRef, useState, type ChangeEvent, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "@/shared/assets/default_avatar.png";
import { Button } from "@/shared/components";
import styles from "./ProfilePage.module.css";
import { PencilSolid } from "@/shared/icons";
import { useCloudinaryUpload } from "@/shared/hooks";
import { changePassword, updateProfile } from "../../api";
import { useAuth } from "@/shared/context/AuthContext";
import { Header } from "@/shared/layout";

export const ProfilePage = ({
  isEditing = false,
}: {
  isEditing?: boolean;
}): JSX.Element => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [newUsername, setNewUsername] = useState(user?.username ?? "");
  const [newAvatarUrl, setNewAvatarUrl] = useState(user?.avatar_url ?? "");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(
    null,
  );

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

  const handleChangePassword = async () => {
    if (!user) return;
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError("New passwords do not match.");
      return;
    }
    try {
      await changePassword(currentPassword, newPassword, confirmNewPassword);
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordChangeError(null);
      alert("Password changed successfully!");
    } catch (err) {
      console.error("Failed to change password:", err);
      setPasswordChangeError(
        "Failed to change password. Check console for details.",
      );
    }
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
    <>
      <Header />
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
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate("/profile/edit")}
              >
                Edit Profile
              </Button>
            )}
          </div>

          <div className={styles.divider}></div>

          <div className={styles.infoSection}>
            <div className={styles.infoLabel}>User ID</div>
            <div className={styles.infoValue}>#{user.id}</div>
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

            <div className={styles.infoLabel}>Password</div>
            <div className={styles.changePasswordContainer}>
              <div className={styles.infoValue}>********</div>
              {isEditing && (
                <PencilSolid
                  className={styles.editPasswordIcon}
                  onClick={() => setIsChangingPassword(true)}
                />
              )}
              {isChangingPassword && (
                <div className={styles.changePasswordForm}>
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={styles.passwordInput}
                  />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={styles.passwordInput}
                  />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className={styles.passwordInput}
                  />
                  <div className={styles.passwordActions}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleChangePassword}
                      disabled={!isChangingPassword}
                    >
                      Change Password
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setIsChangingPassword(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  {passwordChangeError && (
                    <div className={styles.error}>
                      {String(passwordChangeError)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className={styles.editActions}>
              <Button
                variant="outlined"
                size="large"
                onClick={handleSave}
                disabled={isUploading}
              >
                Save
              </Button>
              <Button variant="outlined" size="large" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate("/")}
            >
              Back to Home
            </Button>
          )}
          {uploadError && (
            <div className={styles.error}>{String(uploadError)}</div>
          )}
        </div>
      </div>
    </>
  );
};
