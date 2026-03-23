import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import styles from "../AuthForm.module.css";
import { useAuth } from "@/shared/context/AuthContext";
import { AlertMessage } from "@/shared/components";
import { ApiError } from "@/shared/api/errors";
import { loginSchema, type LoginFormValues } from "./schema";

export const LoginForm = () => {
  /**
   * Login form handling email/password authentication and navigation on success.
   * Displays API-level errors using `AlertMessage`.
   */
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onFormSubmit = async (data: LoginFormValues) => {
    setApiError("");
    try {
      await login(data.email, data.password);
      navigate("/");
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.getReadableMessage("Login failed")
          : err instanceof Error
            ? err.message
            : "Login failed",
      );
    }
  };

  return (
    <>
      <h2 className={styles.title}>Log in to AdaStream</h2>
      <form onSubmit={handleSubmit(onFormSubmit)} className={styles.form}>
        <AlertMessage message={apiError} onDismiss={() => setApiError("")} />

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
            type="password"
            className={styles.inputField}
            {...register("password")}
          />
          {errors.password && (
            <span className={styles.errorText} role="alert">
              {errors.password.message}
            </span>
          )}
        </div>

        <button
          className={styles.submitButton}
          type="submit"
          disabled={isSubmitting}
          aria-label={isSubmitting ? "Logging in..." : "Log In"}
        >
          {isSubmitting ? "Logging in..." : "Log In"}
        </button>
      </form>
    </>
  );
};
