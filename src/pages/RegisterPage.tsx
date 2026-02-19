import RegistrationForm from "../components/features/auth/RegistrationForm";
import AuthFormFooter from "../components/features/auth/AuthFormFooter";
import styles from "../components/features/auth/AuthPages.module.css";

interface RegisterPageProps {
  onSuccess?: () => void;
}

const RegisterPage = ({ onSuccess }: RegisterPageProps) => {
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

export default RegisterPage;