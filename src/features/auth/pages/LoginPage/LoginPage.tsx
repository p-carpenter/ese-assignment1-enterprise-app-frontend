import { AuthLayout } from "@/features/auth";
import { LoginForm } from "@/features/auth";
import { AuthFormFooter } from "../../components/AuthFormFooter/AuthFormFooter";
import { Link } from "react-router-dom";
import styles from "./LoginPage.module.css";
import authStyles from "../AuthPages.module.css";

/**
 * Login page layout composed of `AuthLayout` and `LoginForm`.
 * Presents password reset link and footer with registration CTA.
 * @returns The login page element.
 */
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
        linkText="Sign up to AdaStream"
        linkTo="/register"
      />
    </AuthLayout>
  );
};
