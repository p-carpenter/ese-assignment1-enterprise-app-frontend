import { useState } from "react";
import { api } from "@/shared/api/client";
import styles from "../AuthForm.module.css";

interface RequestResetPasswordFormProps {
  onSuccess?: () => void;
}

export const RequestResetPasswordForm = ({
  onSuccess,
}: RequestResetPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await api.auth.requestPasswordReset(email);
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to request password reset",
      );
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
            Password reset requested! Please check your email for a confirmation
            link.
          </div>
        )}
        <input
          placeholder="Email address"
          className={styles.inputField}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          className={styles.submitButton}
          type="submit"
          disabled={isLoading}
        >
          {isLoading
            ? "Requesting password reset..."
            : "Request Password Reset"}
        </button>
      </form>
    </>
  );
};
