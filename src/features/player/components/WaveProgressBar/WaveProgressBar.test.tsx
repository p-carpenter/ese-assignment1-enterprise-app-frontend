import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WaveProgressBar } from "./WaveProgressBar";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("WaveProgressBar", () => {
  const defaultProps = {
    currentSong: { id: 1, duration: 100 },
    duration: 100,
    seek: vi.fn(),
    getPosition: vi.fn(() => 10),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.useFakeTimers({
      toFake: [
        "requestAnimationFrame",
        "cancelAnimationFrame",
        "setTimeout",
        "clearTimeout",
      ],
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe("Responsive Layout & Rendering", () => {
    it("renders the correct number of bars for collapsed mode (280)", () => {
      render(<WaveProgressBar {...defaultProps} isExpanded={false} />);
      act(() => {
        vi.advanceTimersByTime(16);
      });

      const waveLayer = screen.getByTestId("wave-layer");
      expect(waveLayer.children.length).toBe(280);
    });

    it("renders the correct number of bars for expanded mode (80)", () => {
      render(<WaveProgressBar {...defaultProps} isExpanded={true} />);
      act(() => {
        vi.advanceTimersByTime(16);
      });

      const waveLayer = screen.getByTestId("wave-layer");
      expect(waveLayer.children.length).toBe(80);
    });
  });

  describe("Animation & Sync Logic", () => {
    it("syncs progress from getPosition on animation frames", () => {
      const getPosition = vi.fn(() => 42);
      render(<WaveProgressBar {...defaultProps} getPosition={getPosition} />);

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(getPosition).toHaveBeenCalled();
      const slider = screen.getByRole("slider", { name: "Seek time" });
      expect(slider).toHaveValue("42");
    });

    it("does not start animation loop if currentSong is missing", () => {
      const getPosition = vi.fn();
      render(
        <WaveProgressBar
          {...defaultProps}
          currentSong={undefined}
          getPosition={getPosition}
        />,
      );

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(getPosition).not.toHaveBeenCalled();
    });

    it("pauses sync while user is dragging", () => {
      const getPosition = vi.fn(() => 50);

      render(<WaveProgressBar {...defaultProps} getPosition={getPosition} />);
      act(() => {
        vi.advanceTimersByTime(16);
      });

      const slider = screen.getByRole("slider", { name: "Seek time" });
      getPosition.mockClear();

      fireEvent.input(slider, { target: { value: "60" } });

      act(() => {
        vi.advanceTimersByTime(50);
      });

      // Sync must be paused because isDragging is true.
      expect(getPosition).not.toHaveBeenCalled();

      fireEvent.change(slider, { target: { value: "60" } });
    });

    it("cancels animation frame on unmount", () => {
      const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");
      const { unmount } = render(<WaveProgressBar {...defaultProps} />);

      act(() => {
        vi.advanceTimersByTime(16);
      });

      unmount();
      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe("Interaction & Edge Cases", () => {
    it("stops polling getPosition and fires seek when user interacts", () => {
      const getPosition = vi.fn(() => 50);
      const seek = vi.fn();

      render(
        <WaveProgressBar
          {...defaultProps}
          getPosition={getPosition}
          seek={seek}
        />,
      );
      act(() => {
        vi.advanceTimersByTime(16);
      });

      const slider = screen.getByRole("slider", { name: "Seek time" });

      slider.focus();

      // Complete a synchronous interaction cycle.
      fireEvent.keyDown(slider, { key: "ArrowRight" });
      fireEvent.keyUp(slider, { key: "ArrowRight" });

      expect(seek).toHaveBeenCalled();
    });

    it("disables slider when duration is 0", () => {
      render(
        <WaveProgressBar
          {...defaultProps}
          duration={0}
          currentSong={{ id: 1, duration: 0 }}
        />,
      );
      act(() => {
        vi.advanceTimersByTime(16);
      });

      const slider = screen.getByRole("slider", { name: "Seek time" });
      expect(slider).toBeDisabled();
    });

    it("defaults maxValue to 100 if duration is missing to avoid slider crash", () => {
      render(
        <WaveProgressBar
          seek={vi.fn()}
          getPosition={vi.fn(() => 0)}
          currentSong={{ id: 1, duration: 0 }}
        />,
      );
      act(() => {
        vi.advanceTimersByTime(16);
      });

      const slider = screen.getByRole("slider", { name: "Seek time" });
      expect(slider).toHaveAttribute("max", "100");
    });
  });

  it("should have no accessibility violations", async () => {
    // Axe requires real timers to resolve its internal promises.
    vi.useRealTimers();

    const { container } = render(<WaveProgressBar {...defaultProps} />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
