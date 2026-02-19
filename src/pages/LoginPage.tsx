import { Link } from "react-router-dom";
import LoginForm from "../components/features/auth/LoginForm";
import AuthFormFooter from "../components/features/auth/AuthFormFooter";
import styles from "../components/features/auth/AuthPages.module.css";

interface LoginPageProps {
  onSuccess: () => void;
}

const LoginPage = ({ onSuccess }: LoginPageProps) => {
  return (
    <>
      <div className="app-header">
        <h1 className="app-title">Music Player</h1>
      </div>
      <div className={styles.container}>
        <LoginForm onSuccess={onSuccess} />

        <Link to="/forgot-password" className={styles.forgotPasswordLink}>
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

export default LoginPage;
