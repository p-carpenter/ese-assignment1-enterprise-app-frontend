import { useNavigate, useParams } from "react-router-dom";
import { AuthLayout } from "@/features/auth";
import styles from "../AuthPages.module.css";
import { useEffect, useState } from "react";
import { verifyRegistrationEmail } from "../../api";

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
        <div className={styles.success}>
          Your email has been verified! You will be redirected to the login page
          shortly. If you are not redirected, please click{" "}
          <a href="/login">here</a>.
        </div>
      )}

      {!isVerifying && error && <div className={styles.error}>{error}</div>}
    </AuthLayout>
  );
};
