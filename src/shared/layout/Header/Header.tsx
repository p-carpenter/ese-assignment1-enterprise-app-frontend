import { useNavigate } from "react-router-dom";
import styles from "./Header.module.css";
import type { JSX } from "react";
import { Button } from "@/shared/components";
import { logout } from "@/features/auth/api";
import { useAuth } from "@/shared/context/AuthContext";

export const Header = (): JSX.Element => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const userInitial = user?.username?.charAt(0).toUpperCase() || "U";
  const avatarUrl = user?.avatar_url;

  return (
    <div className={styles.header}>
      <h1 className={styles.title}>Music Player</h1>
      <div className={styles.actions}>
        <Button
          variant="primary"
          size="small"
          onClick={() => navigate("/upload")}
        >
          Upload
        </Button>
        <button
          className={styles.avatarButton}
          onClick={() => navigate("/profile")}
          title="View Profile"
        >
          {avatarUrl ? <img src={avatarUrl} alt="Profile" /> : userInitial}
        </button>
        <Button variant="outlined" size="small" onClick={handleLogout}>
          Log Out
        </Button>
      </div>
    </div>
  );
};
