import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import styles from "./Header.module.css";
import type { JSX } from "react";
import { Button } from "@/shared/components";
import { useAuth } from "@/shared/context/AuthContext";
import { useDebounce } from "use-debounce";
import { TiHome } from "react-icons/ti";

export const Header = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("q") ?? "",
  );
  const [debouncedSearch] = useDebounce(searchInput, 300);

  // Sync debounced search value to URL
  useEffect(() => {
    if (location.pathname === "/") {
      const current = searchParams.get("q") ?? "";
      if (debouncedSearch !== current) {
        navigate(
          debouncedSearch ? `/?q=${encodeURIComponent(debouncedSearch)}` : "/",
          { replace: true },
        );
      }
    } else if (debouncedSearch) {
      navigate(`/?q=${encodeURIComponent(debouncedSearch)}`);
    }
  }, [debouncedSearch, location.pathname, searchParams, navigate]);

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      setUser(null);
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const avatarUrl = user?.avatar_url;

  return (
    <div className={styles.header}>
      <h1
        className={styles.title}
        onClick={() => {
          setSearchInput("");
          navigate("/");
        }}
      >
        Music Player
      </h1>
      <div className={styles.centreActions}>
        <div className={styles.homeButton}>
          <TiHome
            size={28}
            onClick={() => {
              setSearchInput("");
              navigate("/");
            }}
          />
        </div>
        <div className={styles.searchWrapper}>
          <input
            type="search"
            placeholder="Search songs..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles.searchInput}
            aria-label="Search songs"
          />
        </div>
      </div>
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
  );
};
