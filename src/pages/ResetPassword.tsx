import AuthFormFooter from "../components/features/auth/AuthFormFooter";
import styles from "../components/features/auth/AuthPages.module.css";
import ResetPasswordForm from "../components/features/auth/ResetPasswordForm";

interface ResetPasswordPageProps {
  onSuccess: () => void;
}

const ResetPasswordPage = ({ onSuccess }: ResetPasswordPageProps) => {
  return (
    <>
      <div className="app-header">
        <h1 className="app-title">Music Player</h1>
      </div>
      <div className={styles.container}>
        <ResetPasswordForm onSuccess={onSuccess} />

        <div className={styles.divider}></div>

        <AuthFormFooter
          footerText="Sorted out your password?"
          linkText="Go back to login"
          linkTo="/login"
        />
      </div>
    </>
  );
};

export default ResetPasswordPage;
