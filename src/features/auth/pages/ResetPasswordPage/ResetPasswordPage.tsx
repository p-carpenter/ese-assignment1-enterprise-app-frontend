import { AuthFormFooter } from "../../components/AuthFormFooter/AuthFormFooter";
import { ResetPasswordForm } from "../../components/ResetPasswordForm/ResetPasswordForm";
import { AuthLayout } from "@/features/auth";
import authStyles from "../AuthPages.module.css";

interface ResetPasswordPageProps {
  onSuccess: () => void;
}

export const ResetPasswordPage = ({ onSuccess }: ResetPasswordPageProps) => {
  return (
    <AuthLayout>
      <ResetPasswordForm onSuccess={onSuccess} />

      <div className={authStyles.divider}>
        <span>or</span>
      </div>

      <AuthFormFooter
        footerText="Sorted out your password?"
        linkText="Go back to login"
        linkTo="/login"
      />
    </AuthLayout>
  );
};
