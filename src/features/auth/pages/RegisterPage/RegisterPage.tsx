import { RegistrationForm } from "../../components/RegistrationForm/RegistrationForm";
import { AuthFormFooter } from "../../components/AuthFormFooter/AuthFormFooter";
import { AuthLayout } from "../../components/AuthLayout/AuthLayout";
import authStyles from "../AuthPages.module.css";

interface RegisterPageProps {
  onSuccess?: () => void;
}

export const RegisterPage = ({ onSuccess }: RegisterPageProps) => {
  return (
    <>
      <AuthLayout>
        <RegistrationForm onSuccess={onSuccess} />

        <div className={authStyles.divider}>
          <span>or</span>
        </div>

        <AuthFormFooter
          footerText="Already have an account?"
          linkText="Log in to Spotify"
          linkTo="/login"
        />
      </AuthLayout>
    </>
  );
};
