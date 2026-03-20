import { useNavigate, Link } from "react-router-dom";
import styles from "./Header.module.css";
import type { JSX } from "react";
import { Button } from "@/shared/components";
import { useAuth } from "@/shared/context/AuthContext";
import { TiHome, TiThMenu } from "react-icons/ti";
import { SearchBar } from "./SearchBar/SearchBar";
import { MdAdd } from "react-icons/md";

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps): JSX.Element => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const avatarUrl = user?.avatar_url;

  return (
    <div className={styles.header}>
      {onMenuClick && (
        <button
          className={styles.hamburger}
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <TiThMenu size={24} />
        </button>
      )}

      <Link to="/" className={styles.titleLink}>
        <h1 className={styles.title}>Music Player</h1>
      </Link>

      <div className={styles.centreActions}>
        <div className={styles.homeButton}>
          <Link to="/" aria-label="Home" title="Go to homepage">
            <TiHome size={28} aria-hidden="true" />
          </Link>
        </div>

        <SearchBar />
      </div>

      <div className={styles.actions}>
        <Button
          variant="primary"
          size="small"
          onClick={() => navigate("/upload")}
          className={styles.uploadButton}
        >
          <span className={styles.uploadText}>Add Song</span>
          <MdAdd className={styles.uploadIcon} size={20} />
        </Button>

        <div className={styles.desktopAuthActions}>
          <button
            className={styles.avatarButton}
            onClick={() => navigate("/profile")}
            title="View Profile"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className={styles.avatar} />
            ) : (
              <span className={styles.avatarInitial}>
                {user?.username?.[0]?.toUpperCase()}
              </span>
            )}
          </button>
          <Button variant="outlined" size="small" onClick={handleLogout}>
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
};
