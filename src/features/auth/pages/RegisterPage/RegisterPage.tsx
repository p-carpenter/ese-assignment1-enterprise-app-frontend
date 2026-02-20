import { RegistrationForm } from "../../components/RegistrationForm/RegistrationForm";
import { AuthFormFooter } from "../../components/AuthFormFooter/AuthFormFooter";
import styles from "../LoginPage/AuthPages.module.css";

interface RegisterPageProps {
  onSuccess?: () => void;
}

export const RegisterPage = ({ onSuccess }: RegisterPageProps) => {
  return (
    <>
      <div className="app-header">
        <h1 className="app-title">Music Player</h1>
      </div>
      <div className={styles.container}>
        <RegistrationForm onSuccess={onSuccess} />

        <div className={styles.divider}>
          <span>or</span>
        </div>

        <AuthFormFooter
          footerText="Already have an account?"
          linkText="Log in to Spotify"
          linkTo="/login"
        />
      </div>
    </>
  );
};
