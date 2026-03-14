import { useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useDebouncedCallback } from "use-debounce";
import { MdClear } from "react-icons/md";
import styles from "./SearchBar.module.css";

export const SearchBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [searchInput, setSearchInput] = useState(() => searchParams.get("q") ?? "");
    const [originPath, setOriginPath] = useState<string | null>(null);

    const debouncedNavigate = useDebouncedCallback((query: string, origin: string | null) => {
        const trimmed = query.trim();
        if (trimmed) {
            navigate(`/?q=${encodeURIComponent(trimmed)}`);
        } else {
            navigate(origin ?? "/", { replace: true });
        }
    }, 300);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const currentOrigin = originPath ?? (location.pathname !== "/" ? location.pathname : null);
        if (!originPath && location.pathname !== "/") {
            setOriginPath(location.pathname);
        }
        setSearchInput(val);
        debouncedNavigate(val, currentOrigin);
    };

    const handleClear = () => {
        const destination = originPath ?? "/";
        setSearchInput("");
        setOriginPath(null);
        debouncedNavigate.cancel();
        navigate(destination, { replace: true });
    };

    return (
        <div className={styles.searchWrapper}>
            <input
                type="search"
                placeholder="Search songs..."
                value={searchInput}
                onChange={handleInputChange}
                className={styles.searchInput}
                aria-label="Search songs"
            />
            {searchInput && (
                <button
                    className={styles.clearButton}
                    onClick={handleClear}
                    aria-label="Clear search"
                    type="button"
                >
                    <MdClear size={20} />
                </button>
            )}
        </div>
    );
};