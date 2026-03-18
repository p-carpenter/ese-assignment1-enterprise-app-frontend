import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { FileSelect } from "./FileSelect";
import "@testing-library/jest-dom/vitest";

expect.extend(toHaveNoViolations);

describe("FileSelect", () => {
  it("should have no accessibility violations", async () => {
    const { container } = render(
      <FileSelect onFileSelect={() => {}} accept="audio/*" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders with the default 'Choose File' label", () => {
    render(<FileSelect onFileSelect={() => {}} accept="audio/*" />);

    expect(
      screen.getByRole("button", { name: "Choose File" }),
    ).toBeInTheDocument();
  });

  it("renders with a custom label when provided", () => {
    render(
      <FileSelect
        onFileSelect={() => {}}
        accept="audio/*"
        label="Upload Audio"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Upload Audio" }),
    ).toBeInTheDocument();
  });

  it("sets the correct accept attribute on the file input", () => {
    const { container } = render(
      <FileSelect onFileSelect={() => {}} accept="image/*" />,
    );
    // Scope to container instead of global document.
    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveAttribute("accept", "image/*");
  });

  it("calls onFileSelect with the selected file", async () => {
    const user = userEvent.setup();
    const onFileSelect = vi.fn();

    const { container } = render(
      <FileSelect onFileSelect={onFileSelect} accept="audio/*" />,
    );

    const file = new File(["audio content"], "song.mp3", { type: "audio/mp3" });
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    // Simulate real user upload behaviour.
    await user.upload(input, file);

    expect(onFileSelect).toHaveBeenCalledTimes(1);
    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it("does not call onFileSelect when the file list is empty (user cancels dialog)", () => {
    const onFileSelect = vi.fn();
    const { container } = render(
      <FileSelect onFileSelect={onFileSelect} accept="audio/*" />,
    );

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { files: [] } });

    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it("renders a file input that is visually hidden by react-aria", () => {
    const { container } = render(
      <FileSelect onFileSelect={() => {}} accept="image/*" />,
    );
    const input = container.querySelector('input[type="file"]');

    expect(input).toBeInTheDocument();
    expect(input).not.toBeVisible();
  });
});
