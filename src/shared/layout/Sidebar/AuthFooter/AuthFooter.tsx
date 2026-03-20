import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/context/AuthContext";
import { Button, AlertMessage } from "@/shared/components";
import styles from "./AuthFooter.module.css";

export const AuthFooter = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      setError(null);
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Logout failed. Please try again.");
    }
  };

  if (!user) return null;

  return (
    <div className={styles.authFooter}>
      {error && <AlertMessage message={error} />}
      <button
        className={styles.avatarButton}
        onClick={() => navigate("/profile")}
        title="View Profile"
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="Profile" className={styles.avatar} />
        ) : (
          <span className={styles.avatarInitial}>
            {user.username?.[0]?.toUpperCase()}
          </span>
        )}
        <span className={styles.usernameText}>{user.username}</span>
      </button>
      <Button variant="outlined" size="small" onClick={handleLogout}>
        Log Out
      </Button>
    </div>
  );
};
