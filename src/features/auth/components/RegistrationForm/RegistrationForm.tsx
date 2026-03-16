import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { register as registerUser } from "../../api";
import styles from "../AuthForm.module.css";
import { AlertMessage } from "@/shared/components";
import { ApiError } from "@/shared/api/errors";
import { registrationSchema, type RegistrationFormValues } from "./schema";

export const RegistrationForm = () => {
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      password2: "",
    },
  });

  const onFormSubmit = async (data: RegistrationFormValues) => {
    setApiError("");

    try {
      await registerUser(data.username, data.email, data.password, data.password2);
      setSuccess(true);
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.getReadableMessage("Registration failed")
          : err instanceof Error
            ? err.message
            : "Registration failed",
      );
    }
  };

  return (
    <>
      <h2 className={styles.title}>Sign up for Spotify</h2>
      <form onSubmit={handleSubmit(onFormSubmit)} className={styles.form}>
        <AlertMessage message={apiError} onDismiss={() => setApiError("")} />
        <AlertMessage
          message={
            success
              ? "Registration successful! Please check your email for a verification link."
              : null
          }
          variant="success"
        />

        <div className={styles.inputGroup}>
          <input
            placeholder="Username"
            aria-label="Username"
            className={styles.inputField}
            {...register("username")}
          />
          {errors.username && (
            <span className={styles.errorText} role="alert">
              {errors.username.message}
            </span>
          )}
        </div>

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

        <div className={styles.inputGroup}>
          <input
            placeholder="Password"
            aria-label="Password"
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
            placeholder="Confirm Password"
            aria-label="Confirm Password"
            className={styles.inputField}
            type="password"
            {...register("password2")}
          />
          {errors.password2 && (
            <span className={styles.errorText} role="alert">
              {errors.password2.message}
            </span>
          )}
        </div>

        <button
          className={styles.submitButton}
          type="submit"
          disabled={isSubmitting || success}
          aria-label={isSubmitting ? "Signing up..." : "Sign Up"}
        >
          {isSubmitting ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </>
  );
};