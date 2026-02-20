import { type FC, useEffect, useRef, useState } from "react";
import { MoreHorizontalOutline } from "@/shared/icons";
import styles from "./SongManagementDropdown.module.css";

export interface DropdownItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

interface SongManagementDropdownProps {
  dropdownItems?: DropdownItem[];
}

export const SongManagementDropdown: FC<SongManagementDropdownProps> = ({
  dropdownItems,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      ref={dropdownRef}
      className={styles.container}
      onClick={(e) => e.stopPropagation()}
      onMouseOver={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={styles.button}
      >
        <MoreHorizontalOutline />
      </button>
      {isOpen && (
        <div className={styles.dropdownMenu}>
          {dropdownItems?.map((item) => (
            <button
              key={item.label}
              type="button"
              className={styles.dropdownItem}
              disabled={item.disabled}
              onClick={(e) => {
                e.stopPropagation();
                item.onSelect();
                setIsOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
