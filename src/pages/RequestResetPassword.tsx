import AuthFormFooter from "../components/features/auth/AuthFormFooter";
import styles from "../components/features/auth/AuthPages.module.css";
import RequestResetPasswordForm from "../components/features/auth/RequestResetPasswordForm";

interface RequestResetPasswordPageProps {
  onSuccess: () => void;
}

const RequestResetPasswordPage = ({
  onSuccess,
}: RequestResetPasswordPageProps) => {
  return (
    <>
      <div className="app-header">
        <h1 className="app-title">Music Player</h1>
      </div>
      <div className={styles.container}>
        <RequestResetPasswordForm onSuccess={onSuccess} />

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

export default RequestResetPasswordPage;
