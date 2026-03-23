import { AuthFormFooter } from "../../components/AuthFormFooter/AuthFormFooter";
import { ResetPasswordForm } from "../../components/ResetPasswordForm/ResetPasswordForm";
import { AuthLayout } from "@/features/auth";
import authStyles from "../AuthPages.module.css";

/**
 * Page for resetting a user's password via a form.
 * Composes `ResetPasswordForm` within the auth layout and provides footer CTA.
 * @returns Reset password page element.
 */
export const ResetPasswordPage = () => {
  return (
    <AuthLayout>
      <ResetPasswordForm />
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
