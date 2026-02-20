import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar";
import "@testing-library/jest-dom/vitest";

describe("ProgressBar", () => {
  // Prevent the rAF animation loop from running during tests
  beforeEach(() => {
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((_cb: FrameRequestCallback) => 1),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const defaultProps = {
    duration: 180,
    currentSong: { duration: 180 },
    seek: vi.fn(),
    getPosition: vi.fn().mockReturnValue(0),
  };

  it("displays the current position as formatted time (starts at 0:00)", () => {
    render(<ProgressBar {...defaultProps} />);
    // There should be at least one "0:00" time label
    expect(screen.getAllByText("0:00").length).toBeGreaterThan(0);
  });

  it("displays the total duration as formatted time", () => {
    render(<ProgressBar {...defaultProps} duration={180} />);
    expect(screen.getByText("3:00")).toBeInTheDocument();
  });

  it("renders a range slider", () => {
    render(<ProgressBar {...defaultProps} />);
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("sets the slider max attribute to the track duration", () => {
    render(<ProgressBar {...defaultProps} duration={240} currentSong={{ duration: 240 }} />);
    expect(screen.getByRole("slider")).toHaveAttribute("max", "240");
  });

  it("disables the slider when currentSong is undefined", () => {
    render(
      <ProgressBar
        duration={180}
        currentSong={undefined}
        seek={vi.fn()}
        getPosition={vi.fn().mockReturnValue(0)}
      />,
    );
    expect(screen.getByRole("slider")).toBeDisabled();
  });

  it("disables the slider when duration is 0 (nothing loaded)", () => {
    render(
      <ProgressBar
        duration={0}
        currentSong={{ duration: 0 }}
        seek={vi.fn()}
        getPosition={vi.fn().mockReturnValue(0)}
      />,
    );
    expect(screen.getByRole("slider")).toBeDisabled();
  });

  it("is not disabled when a valid currentSong and duration are provided", () => {
    render(<ProgressBar {...defaultProps} />);
    expect(screen.getByRole("slider")).not.toBeDisabled();
  });

  it("calls seek with the slider value on mouseUp", () => {
    const seek = vi.fn();
    render(<ProgressBar {...defaultProps} seek={seek} />);
    const slider = screen.getByRole("slider");
    // Simulate scrubbing to 60 seconds
    Object.defineProperty(slider, "value", { value: "60", configurable: true });
    fireEvent.mouseUp(slider);
    expect(seek).toHaveBeenCalledTimes(1);
  });

  it("calls seek with the slider value on touchEnd", () => {
    const seek = vi.fn();
    render(<ProgressBar {...defaultProps} seek={seek} />);
    const slider = screen.getByRole("slider");
    fireEvent.touchEnd(slider);
    expect(seek).toHaveBeenCalledTimes(1);
  });

  it("uses currentSong.duration as max when it is larger than the duration prop", () => {
    render(
      <ProgressBar
        duration={100}
        currentSong={{ duration: 200 }}
        seek={vi.fn()}
        getPosition={vi.fn().mockReturnValue(0)}
      />,
    );
    expect(screen.getByRole("slider")).toHaveAttribute("max", "200");
  });
});
