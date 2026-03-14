import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button, AlertMessage } from "@/shared/components";
import { changePassword } from "@/features/auth/api";
import styles from "./ChangePasswordForm.module.css";

interface ChangePasswordFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const ChangePasswordForm = ({
  onSuccess,
  onCancel,
}: ChangePasswordFormProps) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate: submitPasswordChange, isPending, error } = useMutation({
    mutationFn: () => changePassword(currentPassword, newPassword, confirmNewPassword),
    onSuccess,
  });

  const handleSubmit = () => {
    setValidationError(null);
    if (newPassword !== confirmNewPassword) {
      setValidationError("New passwords do not match.");
      return;
    }
    submitPasswordChange();
  };

  return (
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

      {validationError && (
        <AlertMessage variant="error" message={validationError} />
      )}
      {error && (
        <AlertMessage variant="error" message="Incorrect current password or server error." />
      )}

      <div className={styles.passwordActions}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Change Password"}
        </Button>
        <Button variant="outlined" size="small" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
};