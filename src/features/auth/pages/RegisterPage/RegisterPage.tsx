import { RegistrationForm } from "../../components/RegistrationForm/RegistrationForm";
import { AuthFormFooter } from "../../components/AuthFormFooter/AuthFormFooter";
import { AuthLayout } from "../../components/AuthLayout/AuthLayout";
import authStyles from "../AuthPages.module.css";

/**
 * Registration page composed of the `RegistrationForm` and footer CTA.
 * @returns The registration page element.
 */
export const RegisterPage = () => {
  return (
    <AuthLayout>
      <RegistrationForm />
      <div className={authStyles.divider}>
        <span>or</span>
      </div>
      <AuthFormFooter
        footerText="Already have an account?"
        linkText="Log in to AdaStream"
        linkTo="/login"
      />
    </AuthLayout>
  );
};
