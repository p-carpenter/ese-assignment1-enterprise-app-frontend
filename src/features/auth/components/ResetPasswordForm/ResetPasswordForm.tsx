import { useState } from "react";
import { confirmPasswordReset } from "../../api";
import styles from "../AuthForm.module.css";
import { useParams } from "react-router-dom";

export const ResetPasswordForm = () => {
  const { uid, token } = useParams<{ uid: string; token: string }>();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    if (!uid || !token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await confirmPasswordReset(uid, token, password, confirmPassword);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h2 className={styles.title}>Reset your password</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        {success && (
          <div className={styles.success}>
            Password reset successfully! You can now log in with your new
            password.
          </div>
        )}
        <input
          placeholder="New password"
          className={styles.inputField}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          placeholder="Confirm new password"
          className={styles.inputField}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button
          className={styles.submitButton}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Resetting password..." : "Reset Password"}
        </button>
      </form>
    </>
  );
};
