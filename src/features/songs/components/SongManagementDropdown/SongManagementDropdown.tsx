import { type FC } from "react";
import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
} from "react-aria-components";
import { MoreHorizontalOutline } from "@/shared/icons";
import styles from "./SongManagementDropdown.module.css";

/**
 * An item shown in the song management dropdown.
 *
 * - `label`: visible text for the menu item.
 * - `onSelect`: callback invoked when the item is chosen.
 * - `disabled`: optional flag to disable the item.
 */
export interface DropdownItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

interface SongManagementDropdownProps {
  dropdownItems?: DropdownItem[];
}

/**
 * Renders a compact dropdown menu for song actions (e.g. edit, delete).
 *
 * The menu items are provided via `dropdownItems` and each item's
 * `onSelect` handler is called when the corresponding menu entry is chosen.
 */
export const SongManagementDropdown: FC<SongManagementDropdownProps> = ({
  dropdownItems,
}) => {
  return (
    <MenuTrigger>
      <Button className={styles.button} aria-label="Song options">
        <MoreHorizontalOutline />
      </Button>

      <Popover placement="bottom end">
        <Menu className={styles.dropdownMenu}>
          {dropdownItems?.map((item) => (
            <MenuItem
              key={item.label}
              className={styles.dropdownItem}
              isDisabled={item.disabled}
              onAction={item.onSelect}
            >
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
};
