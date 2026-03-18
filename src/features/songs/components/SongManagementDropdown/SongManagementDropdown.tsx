import { type FC } from "react";
import { Button, Menu, MenuItem, MenuTrigger, Popover } from "react-aria-components";
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
  return (
    <MenuTrigger>
      <Button className={styles.button}>
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