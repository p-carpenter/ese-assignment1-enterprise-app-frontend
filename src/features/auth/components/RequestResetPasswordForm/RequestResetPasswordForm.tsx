import { useState } from "react";
import styles from "../AuthForm.module.css";
import { requestPasswordReset } from "../../api";
import { AlertMessage } from "@/shared/components";
import { ApiError } from "@/shared/api/errors";

export const RequestResetPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.getReadableMessage("Failed to request password reset")
          : err instanceof Error
            ? err.message
            : "Failed to request password reset",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h2 className={styles.title}>Reset your password</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <AlertMessage message={error} onDismiss={() => setError("")} />
        <AlertMessage
          message={
            success
              ? "Password reset requested! Please check your email for a confirmation link."
              : null
          }
          variant="success"
        />
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
