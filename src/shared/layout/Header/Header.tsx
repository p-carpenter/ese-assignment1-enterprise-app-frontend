import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Header.module.css";
import type { JSX } from "react";
import { Button } from "@/shared/components";
import { logout } from "@/features/auth/api";
import { useAuth } from "@/shared/context/AuthContext";
import { useDebounce } from "use-debounce";

export const Header = (): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebounce(searchInput, 300);
  const isFirstRender = useRef(true);

  // Sync debounced search value to URL after initial mount
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (location.pathname === "/") {
      const params = new URLSearchParams(window.location.search);
      const current = params.get("q") ?? "";
      if (debouncedSearch !== current) {
        navigate(
          debouncedSearch ? `/?q=${encodeURIComponent(debouncedSearch)}` : "/",
          { replace: true },
        );
      }
    } else if (debouncedSearch) {
      navigate(`/?q=${encodeURIComponent(debouncedSearch)}`);
    }
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear search input when navigating away from home
  useEffect(() => {
    if (location.pathname !== "/") {
      setSearchInput("");
    }
  }, [location.pathname]);

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
      <h1
        className={styles.title}
        onClick={() => {
          setSearchInput("");
          navigate("/");
        }}
      >
        Music Player
      </h1>
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
