import { useState } from "react";
import styles from "../AuthForm.module.css";
import { requestPasswordReset } from "../../api";
import { AlertMessage } from "@/shared/components";
import { ApiError } from "@/shared/api/errors";
import {
  requestResetPasswordSchema,
  type RequestResetPasswordFormValues,
} from "./schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export const RequestResetPasswordForm = () => {
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestResetPasswordFormValues>({
    resolver: zodResolver(requestResetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onFormSubmit = async (data: RequestResetPasswordFormValues) => {
    setApiError("");

    try {
      await requestPasswordReset(data.email);
      setSuccess(true);
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.getReadableMessage("Failed to request password reset")
          : err instanceof Error
            ? err.message
            : "Failed to request password reset",
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
              ? "Password reset requested! Please check your email for a confirmation link."
              : null
          }
          variant="success"
        />

        <div className={styles.inputGroup}>
          <input
            placeholder="Email address"
            aria-label="Email address"
            className={styles.inputField}
            type="email"
            {...register("email")}
          />
          {errors.email && (
            <span className={styles.errorText} role="alert">
              {errors.email.message}
            </span>
          )}
        </div>

        <button
          className={styles.submitButton}
          type="submit"
          disabled={isSubmitting || success}
          aria-label={
            isSubmitting
              ? "Requesting password reset..."
              : "Request Password Reset"
          }
        >
          {isSubmitting
            ? "Requesting password reset..."
            : "Request Password Reset"}
        </button>
      </form>
    </>
  );
};
