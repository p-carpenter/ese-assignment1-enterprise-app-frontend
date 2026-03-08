import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AlertMessage } from "./AlertMessage";

describe("AlertMessage", () => {
  // ── Rendering ─────────────────────────────────────────────────────────────

  it("renders nothing when message is null", () => {
    const { container } = render(<AlertMessage message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when message is undefined", () => {
    const { container } = render(<AlertMessage message={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when message is an empty string", () => {
    const { container } = render(<AlertMessage message="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the error message text", () => {
    render(<AlertMessage message="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  // ── Error variant (default) ───────────────────────────────────────────────

  it("defaults to the error variant", () => {
    render(<AlertMessage message="Error occurred" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("uses role='alert' for the error variant", () => {
    render(<AlertMessage message="Bad request" variant="error" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders the warning icon for error variant", () => {
    render(<AlertMessage message="Oops" variant="error" />);
    // The IoWarningOutline icon is an SVG inside the alert
    const alert = screen.getByRole("alert");
    expect(alert.querySelector("svg")).toBeInTheDocument();
  });

  // ── Success variant ───────────────────────────────────────────────────────

  it("uses role='status' for the success variant", () => {
    render(<AlertMessage message="All good!" variant="success" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders the checkmark icon for success variant", () => {
    render(<AlertMessage message="Saved!" variant="success" />);
    const status = screen.getByRole("status");
    expect(status.querySelector("svg")).toBeInTheDocument();
  });

  // ── Dismiss button ────────────────────────────────────────────────────────

  it("does not render a dismiss button when onDismiss is not provided", () => {
    render(<AlertMessage message="Error" />);
    expect(
      screen.queryByRole("button", { name: /dismiss/i }),
    ).not.toBeInTheDocument();
  });

  it("renders a dismiss button when onDismiss is provided", () => {
    render(<AlertMessage message="Error" onDismiss={() => {}} />);
    expect(
      screen.getByRole("button", { name: /dismiss/i }),
    ).toBeInTheDocument();
  });

  it("calls onDismiss when the dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(<AlertMessage message="Error" onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  it("has accessible dismiss button label", () => {
    render(<AlertMessage message="Error" onDismiss={() => {}} />);
    expect(
      screen.getByRole("button", { name: "Dismiss message" }),
    ).toBeInTheDocument();
  });
});
