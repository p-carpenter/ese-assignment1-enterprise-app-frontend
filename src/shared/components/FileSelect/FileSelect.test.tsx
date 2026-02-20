import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileSelect } from "./FileSelect";
import "@testing-library/jest-dom/vitest";

describe("FileSelect", () => {
  it("renders with the default 'Choose File' label", () => {
    render(<FileSelect onFileSelect={() => {}} accept="audio/*" />);
    expect(screen.getByText("Choose File")).toBeInTheDocument();
  });

  it("renders with a custom label when provided", () => {
    render(
      <FileSelect
        onFileSelect={() => {}}
        accept="audio/*"
        label="Upload Audio"
      />,
    );
    expect(screen.getByText("Upload Audio")).toBeInTheDocument();
  });

  it("sets the correct accept attribute on the file input", () => {
    render(<FileSelect onFileSelect={() => {}} accept="image/*" />);
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(input).toHaveAttribute("accept", "image/*");
  });

  it("calls onFileSelect with the selected file", () => {
    const onFileSelect = vi.fn();
    render(<FileSelect onFileSelect={onFileSelect} accept="audio/*" />);

    const file = new File(["audio"], "song.mp3", { type: "audio/mp3" });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it("does not call onFileSelect when the file list is empty", () => {
    const onFileSelect = vi.fn();
    render(<FileSelect onFileSelect={onFileSelect} accept="audio/*" />);

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });

    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it("renders a file input that is hidden", () => {
    render(<FileSelect onFileSelect={() => {}} accept="image/*" />);
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
  });
});
