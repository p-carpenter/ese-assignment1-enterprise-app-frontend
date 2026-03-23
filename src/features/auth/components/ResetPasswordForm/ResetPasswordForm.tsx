import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams } from "react-router-dom";
import { confirmPasswordReset } from "../../api";
import styles from "../AuthForm.module.css";
import { AlertMessage } from "@/shared/components";
import { ApiError } from "@/shared/api/errors";
import { resetPasswordSchema, type ResetPasswordFormValues } from "./schema";

export const ResetPasswordForm = () => {
  /**
   * Form used to set a new password when arriving via a reset link (uid/token).
   * Validates the new password pair and calls the confirm API.
   */
  const { uid, token } = useParams<{ uid: string; token: string }>();

  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onFormSubmit = async (data: ResetPasswordFormValues) => {
    if (!uid || !token) {
      setApiError("Invalid reset link. Please request a new one.");
      return;
    }

    setApiError("");

    try {
      await confirmPasswordReset(
        uid,
        token,
        data.password,
        data.confirmPassword,
      );
      setSuccess(true);
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.getReadableMessage("Failed to reset password")
          : err instanceof Error
            ? err.message
            : "Failed to reset password",
      );
    }
  };

  return (
    <>
      <h2 className={styles.title}>Reset your password</h2>
      <form onSubmit={handleSubmit(onFormSubmit)} className={styles.form}>
        <AlertMessage message={apiError} onDismiss={() => setApiError("")} />
        <AlertMessage
          message={
            success
              ? "Password reset successfully! You can now log in with your new password."
              : null
          }
          variant="success"
        />

        <div className={styles.inputGroup}>
          <input
            placeholder="New password"
            aria-label="New password"
            className={styles.inputField}
            type="password"
            {...register("password")}
          />
          {errors.password && (
            <span className={styles.errorText} role="alert">
              {errors.password.message}
            </span>
          )}
        </div>

        <div className={styles.inputGroup}>
          <input
            placeholder="Confirm new password"
            aria-label="Confirm new password"
            className={styles.inputField}
            type="password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <span className={styles.errorText} role="alert">
              {errors.confirmPassword.message}
            </span>
          )}
        </div>

        <button
          className={styles.submitButton}
          type="submit"
          disabled={isSubmitting || success}
          aria-label={isSubmitting ? "Resetting password..." : "Reset Password"}
        >
          {isSubmitting ? "Resetting password..." : "Reset Password"}
        </button>
      </form>
    </>
  );
};
