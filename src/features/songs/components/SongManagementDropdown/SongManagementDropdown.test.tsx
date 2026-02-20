import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SongManagementDropdown } from "./SongManagementDropdown";
import "@testing-library/jest-dom/vitest";

describe("SongManagementDropdown", () => {
  const makeItems = () => [
    { label: "Edit", onSelect: vi.fn() },
    { label: "Delete", onSelect: vi.fn() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the trigger (⋯) button", () => {
    render(<SongManagementDropdown dropdownItems={makeItems()} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("does not show dropdown items by default", () => {
    render(<SongManagementDropdown dropdownItems={makeItems()} />);
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("shows dropdown items after clicking the trigger button", () => {
    const items = makeItems();
    render(<SongManagementDropdown dropdownItems={items} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("calls onSelect for the correct item when clicked", () => {
    const items = makeItems();
    render(<SongManagementDropdown dropdownItems={items} />);
    fireEvent.click(screen.getByRole("button")); // open
    fireEvent.click(screen.getByText("Edit"));
    expect(items[0].onSelect).toHaveBeenCalledTimes(1);
    expect(items[1].onSelect).not.toHaveBeenCalled();
  });

  it("closes the dropdown after an item is selected", () => {
    render(<SongManagementDropdown dropdownItems={makeItems()} />);
    fireEvent.click(screen.getByRole("button")); // open
    fireEvent.click(screen.getByText("Edit")); // select → closes
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("closes the dropdown when the trigger is clicked a second time", () => {
    render(<SongManagementDropdown dropdownItems={makeItems()} />);
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger); // open
    expect(screen.getByText("Edit")).toBeInTheDocument();
    fireEvent.click(trigger); // close
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("closes the dropdown when clicking outside the component", () => {
    render(
      <div>
        <SongManagementDropdown dropdownItems={makeItems()} />
        <div data-testid="outside">Outside</div>
      </div>,
    );
    fireEvent.click(screen.getByRole("button")); // open
    expect(screen.getByText("Edit")).toBeInTheDocument();
    // Simulate a mousedown outside
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("renders a disabled item as a disabled button", () => {
    render(
      <SongManagementDropdown
        dropdownItems={[{ label: "Edit", onSelect: vi.fn(), disabled: true }]}
      />,
    );
    fireEvent.click(screen.getByRole("button")); // open
    expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
  });

  it("renders with no dropdown items when dropdownItems is undefined", () => {
    render(<SongManagementDropdown />);
    fireEvent.click(screen.getByRole("button")); // open
    // Nothing to assert, but should not crash
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });
});
