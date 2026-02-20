import { AuthFormFooter } from "../../components/AuthFormFooter/AuthFormFooter";
import { RequestResetPasswordForm } from "../../components/RequestResetPasswordForm/RequestResetPasswordForm";
import { AuthLayout } from "../../components/AuthLayout/AuthLayout";
import authStyles from "../AuthPages.module.css";

interface RequestResetPasswordPageProps {
  onSuccess: () => void;
}

export const RequestResetPasswordPage = ({
  onSuccess,
}: RequestResetPasswordPageProps) => {
  return (
    <>
      <AuthLayout>
        <RequestResetPasswordForm onSuccess={onSuccess} />

        <div className={authStyles.divider}>
          <span>or</span>
        </div>

        <AuthFormFooter
          footerText="Remembered your password?"
          linkText="Go back to login"
          linkTo="/login"
        />
      </AuthLayout>
    </>
  );
};
