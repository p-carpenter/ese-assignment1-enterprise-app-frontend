import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";
import "@testing-library/jest-dom/vitest";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

describe("Modal", () => {
  it("renders nothing when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={() => { }}>
        Content
      </Modal>,
    );
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("renders children when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={() => { }}>
        Content
      </Modal>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders the title when provided", () => {
    render(
      <Modal isOpen={true} onClose={() => { }} title="My Title">
        Content
      </Modal>,
    );
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });

  it("does not render a title element when no title is given", () => {
    render(
      <Modal isOpen={true} onClose={() => { }}>
        Content
      </Modal>,
    );
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    // Check for aria-label on Dialog
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-label", "Dialog");
  });

  it("calls onClose when the close (×) button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the overlay backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    const overlay = dialog.parentElement as HTMLElement;

    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when the modal card itself is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>,
    );

    await user.click(screen.getByText("Content"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when the Escape key is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose for non-Escape keys", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>,
    );

    await user.keyboard("{Enter}");
    await user.keyboard("{Tab}");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should have no accessibility violations when open", async () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => { }} title="Accessible Modal">
        Content
      </Modal>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});