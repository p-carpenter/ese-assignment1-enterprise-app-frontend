import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "./Modal";
import "@testing-library/jest-dom/vitest";

describe("Modal", () => {
  it("renders nothing when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("renders children when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders the title when provided", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="My Title">
        Content
      </Modal>,
    );
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });

  it("does not render a title element when no title is given", () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        Content
      </Modal>,
    );
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("calls onClose when the close (×) button is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the overlay backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>,
    );
    // The outermost element is the overlay div
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when the modal card itself is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>,
    );
    fireEvent.click(screen.getByText("Content"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when the Escape key is pressed", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose for non-Escape keys", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Enter" });
    fireEvent.keyDown(document, { key: "Tab" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("removes the keydown listener when modal closes", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen={true} onClose={onClose}>
        Content
      </Modal>,
    );
    rerender(
      <Modal isOpen={false} onClose={onClose}>
        Content
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});
