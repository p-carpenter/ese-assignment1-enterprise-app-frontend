import { AuthFormFooter } from "../../components/AuthFormFooter/AuthFormFooter";
import styles from "../LoginPage/AuthPages.module.css";
import { ResetPasswordForm } from "../../components/ResetPasswordForm/ResetPasswordForm";

interface ResetPasswordPageProps {
  onSuccess: () => void;
}

export const ResetPasswordPage = ({ onSuccess }: ResetPasswordPageProps) => {
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
