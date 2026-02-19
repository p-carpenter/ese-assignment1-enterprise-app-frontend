import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../../services/api";
import styles from "./LoginForm.module.css"; // Reuse the same styles

interface RegistrationFormProps {
  onSuccess?: () => void;
}

const RegistrationForm = ({ onSuccess }: RegistrationFormProps) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await api.register(username, email, password, password2);
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Sign up for Spotify</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.error}>{error}</div>}
        {success && (
          <div className={styles.success}>
            Registration successful! Please check your email for a verification
            link.
          </div>
        )}
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
      <div className={styles.divider}>
        <span>or</span>
      </div>
      <div className={styles.footer}>
        <span className={styles.footerText}>Already have an account?</span>
        <Link to="/login" className={styles.footerLink}>
          Log in to Spotify
        </Link>
      </div>
    </div>
  );
};

export default memo(RegistrationForm);
