import { useState } from "react";
import { register } from "../../api";
import styles from "../AuthForm.module.css";
import { AlertMessage } from "@/shared/components";
import { ApiError } from "@/shared/api/errors";

export const RegistrationForm = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await register(username, email, password, password2);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.getReadableMessage("Registration failed")
          : err instanceof Error
            ? err.message
            : "Registration failed",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h2 className={styles.title}>Sign up for Spotify</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <AlertMessage message={error} onDismiss={() => setError("")} />
        <AlertMessage
          message={
            success
              ? "Registration successful! Please check your email for a verification link."
              : null
          }
          variant="success"
        />
        <input
          placeholder="Username"
          className={styles.inputField}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          placeholder="Email address"
          className={styles.inputField}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          placeholder="Password"
          type="password"
          className={styles.inputField}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          placeholder="Confirm Password"
          type="password"
          className={styles.inputField}
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
        />
        <button
          className={styles.submitButton}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </>
  );
};
