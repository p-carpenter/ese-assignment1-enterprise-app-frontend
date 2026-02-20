import { useNavigate } from "react-router-dom";
import styles from "./Header.module.css";
import type { JSX } from "react";
import { Button } from "@/shared/components";
import { logout } from "@/features/auth/api";

interface HeaderProps {
  onLogout: () => void;
  userInitial?: string;
  avatarUrl?: string;
}

export const Header = ({
  onLogout,
  userInitial = "U",
  avatarUrl,
}: HeaderProps): JSX.Element => {
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      onLogout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

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
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" />
          ) : (
            userInitial.toUpperCase()
          )}
        </button>
        <Button variant="outlined" size="small" onClick={handleLogout}>
          Log Out
        </Button>
      </div>
    </div>
  );
};
