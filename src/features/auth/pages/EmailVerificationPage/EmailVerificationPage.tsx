import { useNavigate, useParams } from "react-router-dom";
import { AuthLayout } from "@/features/auth";
import { useEffect, useState } from "react";
import { verifyRegistrationEmail } from "../../api";
import { AlertMessage } from "@/shared/components";

/**
 * Page that consumes an email verification `key` from the route and attempts to verify
 * the user's email via the `verifyRegistrationEmail` API. Shows status and redirects
 * to the login page on success.
 * @returns Email verification page element.
 */
export const EmailVerificationPage = () => {
  const { key } = useParams<{ key: string }>();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const verifyEmail = async () => {
      if (!key) {
        setError(
          "Missing verification key. Please try verifying your email again.",
        );
        setIsVerifying(false);
        return;
      }

      setError("");

      try {
        await verifyRegistrationEmail(key);
        setSuccess(true);
        timeoutId = setTimeout(() => {
          navigate("/login");
        }, 3000);
      } catch {
        setError(
          "Failed to confirm your email. The key may be invalid or expired.",
        );
      } finally {
        setIsVerifying(false);
      }
    };

    void verifyEmail();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [key, navigate]);

  return (
    <AuthLayout>
      {isVerifying && <div>Verifying your email...</div>}

      {!isVerifying && success && (
        <AlertMessage
          message={
            "Your email has been verified! You will be redirected to the login page shortly. If you are not redirected, please click here."
          }
          variant="success"
        />
      )}

      {!isVerifying && error && <AlertMessage message={error} />}
    </AuthLayout>
  );
};
