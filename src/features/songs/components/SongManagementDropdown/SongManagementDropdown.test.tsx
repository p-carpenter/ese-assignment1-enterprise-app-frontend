import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { SongManagementDropdown } from "./SongManagementDropdown";
import "@testing-library/jest-dom/vitest";

// Extend Vitest's expect with jest-axe assertions.
expect.extend(toHaveNoViolations);

describe("SongManagementDropdown", () => {
  const makeItems = () => [
    { label: "Edit", onSelect: vi.fn() },
    { label: "Delete", onSelect: vi.fn() },
  ];

  const setupUser = () => {
    return userEvent.setup();
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });


  describe("Rendering", () => {
    it("renders the trigger button closed by default", () => {
      render(<SongManagementDropdown dropdownItems={makeItems()} />);
      expect(screen.getByRole("button", { expanded: false })).toBeInTheDocument();
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("renders with no dropdown items when dropdownItems is undefined", async () => {
      const user = setupUser();
      render(<SongManagementDropdown />);

      await user.click(screen.getByRole("button"));

      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();
    });
  });

  describe("Mouse Interactions", () => {
    it("opens the menu on click and displays items", async () => {
      const user = setupUser();
      render(<SongManagementDropdown dropdownItems={makeItems()} />);

      await user.click(screen.getByRole("button"));
      expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    });

    it("calls onSelect and closes when clicking a valid item", async () => {
      const user = setupUser();
      const items = makeItems();
      render(<SongManagementDropdown dropdownItems={items} />);

      await user.click(screen.getByRole("button"));
      await user.click(screen.getByRole("menuitem", { name: "Edit" }));

      expect(items[0].onSelect).toHaveBeenCalledTimes(1);

      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    it("closes the dropdown when clicking the background (outside)", async () => {
      const user = setupUser();
      render(<SongManagementDropdown dropdownItems={makeItems()} />);

      await user.click(screen.getByRole("button"));
      expect(screen.getByRole("menu")).toBeInTheDocument();

      await user.click(document.body);

      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  describe("Keyboard Navigation & Accessibility", () => {
    it("has no basic accessibility violations (axe-core)", async () => {
      const { container } = render(<SongManagementDropdown dropdownItems={makeItems()} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("can be opened and navigated using the keyboard (Enter/Arrow Keys)", async () => {
      const user = setupUser();
      const items = makeItems();
      render(<SongManagementDropdown dropdownItems={items} />);

      // Tab to button, press Enter to open.
      await user.tab();
      expect(screen.getByRole("button")).toHaveFocus();
      await user.keyboard("{Enter}");

      // First item should auto-focus in standard ARIA menus.
      expect(screen.getByRole("menuitem", { name: "Edit" })).toHaveFocus();

      // Arrow down to second item.
      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveFocus();

      // Trigger selection with Enter.
      await user.keyboard("{Enter}");
      expect(items[1].onSelect).toHaveBeenCalledTimes(1);
    });

    it("closes via the Escape key", async () => {
      const user = setupUser();
      render(<SongManagementDropdown dropdownItems={makeItems()} />);

      await user.click(screen.getByRole("button"));
      expect(screen.getByRole("menu")).toBeInTheDocument();

      await user.keyboard("{Escape}");

      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("renders a disabled item that cannot be clicked", async () => {
      const user = setupUser();
      const onSelect = vi.fn();
      render(
        <SongManagementDropdown
          dropdownItems={[{ label: "Edit", onSelect, disabled: true }]}
        />,
      );

      await user.click(screen.getByRole("button"));

      const disabledItem = screen.getByRole("menuitem", { name: "Edit" });
      expect(disabledItem).toHaveAttribute("aria-disabled", "true");

      // Clicking a disabled item should not trigger the callback.
      await user.click(disabledItem);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("handles long text labels without crashing", async () => {
      const user = setupUser();
      const longText = "A".repeat(200);
      render(
        <SongManagementDropdown
          dropdownItems={[{ label: longText, onSelect: vi.fn() }]}
        />,
      );

      await user.click(screen.getByRole("button"));
      expect(screen.getByRole("menuitem", { name: longText })).toBeInTheDocument();
    });
  });
});