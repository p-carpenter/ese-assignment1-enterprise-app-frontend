import { useState } from "react";
import { PencilSolid } from "@/shared/icons";
import { ChangePasswordForm } from "../ChangePasswordForm/ChangePasswordForm";
import styles from "./ProfileInfo.module.css";

interface ProfileInfoProps {
  id: number | string;
  username: string;
  email: string;
  isEditing: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChangeSuccess: () => void;
}

export const ProfileInfo = ({
  id,
  username,
  email,
  isEditing,
  onUsernameChange,
  onPasswordChangeSuccess,
}: ProfileInfoProps) => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  return (
    <div className={styles.infoSection}>
      <div className={styles.infoLabel}>User ID</div>
      <div className={styles.infoValue}>#{id}</div>

      <div className={styles.infoLabel}>Username</div>
      {isEditing ? (
        <div className={styles.editInputContainer}>
          <input
            className={styles.editInfoValue}
            placeholder={username}
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
          />
          <PencilSolid className={styles.inputIcon} />
        </div>
      ) : (
        <div className={styles.infoValue}>{username}</div>
      )}

      <div className={styles.infoLabel}>Email</div>
      <div className={styles.infoValue}>{email}</div>

      <div className={styles.infoLabel}>Password</div>
      <div className={styles.changePasswordContainer}>
        {isChangingPassword ? (
          <ChangePasswordForm
            onSuccess={() => {
              setIsChangingPassword(false);
              onPasswordChangeSuccess();
            }}
            onCancel={() => setIsChangingPassword(false)}
          />
        ) : (
          <>
            <div className={styles.infoValue}>********</div>
            {isEditing && (
              <PencilSolid
                className={styles.editPasswordIcon}
                onClick={() => setIsChangingPassword(true)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
