import { AuthFormFooter } from "../../components/AuthFormFooter/AuthFormFooter";
import styles from "../LoginPage/AuthPages.module.css";
import { RequestResetPasswordForm } from "../../components/RequestResetPasswordForm/RequestResetPasswordForm";

interface RequestResetPasswordPageProps {
  onSuccess: () => void;
}

export const RequestResetPasswordPage = ({
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
