import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import styles from "./Header.module.css";
import type { JSX } from "react";

interface HeaderProps {
  onLogout: () => void;
  userInitial?: string;
  avatarUrl?: string;
}

const Header = ({
  onLogout,
  userInitial = "U",
  avatarUrl,
}: HeaderProps): JSX.Element => {
  const navigate = useNavigate();

  const handleLogout = async (): Promise<void> => {
    try {
      await api.logout();
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
        <button
          className={styles.uploadButton}
          onClick={() => navigate("/upload")}
        >
          Upload
        </button>
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
        <button className={styles.logoutButton} onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Header;
