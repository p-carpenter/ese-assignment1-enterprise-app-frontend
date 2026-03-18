import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WaveProgressBar } from "./WaveProgressBar";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("WaveProgressBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders disabled slider semantics when there is no current song", () => {
    render(
      <WaveProgressBar
        seek={vi.fn()}
        getPosition={vi.fn(() => 0)}
        duration={120}
      />,
    );

    const slider = screen.getByRole("slider", { name: "Seek time" });
    expect(slider).toBeDisabled();
  });

  it("seeks when the slider value changes via user interaction", () => {
    const seek = vi.fn();
    render(
      <WaveProgressBar
        currentSong={{ id: 9, duration: 100 }}
        duration={100}
        seek={seek}
        getPosition={vi.fn(() => 0)}
      />,
    );

    const slider = screen.getByRole("slider", { name: "Seek time" });

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    fireEvent.keyUp(slider, { key: "ArrowRight" });

    expect(seek).toHaveBeenCalled();
  });

  it("syncs progress from getPosition on animation frames", () => {
    const getPosition = vi.fn(() => 42);
    let rafCallback: FrameRequestCallback | null = null;

    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });

    render(
      <WaveProgressBar
        currentSong={{ id: 1, duration: 100 }}
        duration={100}
        seek={vi.fn()}
        getPosition={getPosition}
      />,
    );

    act(() => {
      rafCallback?.(0);
    });

    expect(getPosition).toHaveBeenCalled();
    expect(screen.getByRole("slider", { name: "Seek time" })).toHaveValue("42");
  });

  it("cancels animation frame on unmount", () => {
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(77);
    const cancelSpy = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => {});

    const { unmount } = render(
      <WaveProgressBar
        currentSong={{ id: 1, duration: 100 }}
        duration={100}
        seek={vi.fn()}
        getPosition={vi.fn(() => 0)}
      />,
    );

    unmount();
    expect(cancelSpy).toHaveBeenCalledWith(77);
  });

  it("should have no accessibility violations", async () => {
    const { container } = render(
      <WaveProgressBar
        currentSong={{ id: 1, duration: 100 }}
        duration={100}
        seek={vi.fn()}
        getPosition={vi.fn(() => 0)}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
