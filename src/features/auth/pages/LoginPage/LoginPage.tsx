import { Link } from "react-router-dom";
import { LoginForm } from "../../components/LoginForm/LoginForm";
import { AuthFormFooter } from "../../components/AuthFormFooter/AuthFormFooter";
import styles from "./AuthPages.module.css";

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage = ({ onSuccess }: LoginPageProps) => {
  return (
    <>
      <div className="app-header">
        <h1 className="app-title">Music Player</h1>
      </div>
      <div className={styles.container}>
        <LoginForm onSuccess={onSuccess} />

        <Link to="/reset-password" className={styles.forgotPasswordLink}>
          Forgot your password?
        </Link>

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <AuthFormFooter
          footerText="Don't have an account?"
          linkText="Sign up for Spotify"
          linkTo="/register"
        />
      </div>
    </>
  );
};
