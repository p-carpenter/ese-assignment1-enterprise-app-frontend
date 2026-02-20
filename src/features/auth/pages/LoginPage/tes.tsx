import { AuthLayout } from "@/features/auth";
import { LoginForm } from "@/features/auth";
import { AuthFormFooter } from "../../components/AuthFormFooter/AuthFormFooter";
import { Link } from "react-router-dom";
import styles from "../../components/AuthLayout/AuthLayout.module.css";

interface LoginPageProps {
  onSuccess: () => void;
}

const LoginPage = ({ onSuccess }: LoginPageProps) => {
  return (
    <AuthLayout>
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
    </AuthLayout>
  );
};