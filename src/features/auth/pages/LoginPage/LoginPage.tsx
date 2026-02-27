import { AuthLayout } from "@/features/auth";
import { LoginForm } from "@/features/auth";
import { AuthFormFooter } from "../../components/AuthFormFooter/AuthFormFooter";
import { Link } from "react-router-dom";
import styles from "./LoginPage.module.css";
import authStyles from "../AuthPages.module.css";

export const LoginPage = () => {
  return (
    <AuthLayout>
      <LoginForm />
      <Link to="/reset-password" className={styles.forgotPasswordLink}>
        Forgot your password?
      </Link>
      <div className={authStyles.divider}>
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
