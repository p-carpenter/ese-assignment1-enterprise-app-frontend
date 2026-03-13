import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WaveProgressBar } from "./WaveProgressBar";

describe("WaveProgressBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setupMockSlider = (width = 200, left = 0) => {
    const slider = screen.getByRole("slider", {
      name: "Seek",
    }) as HTMLDivElement;
    Object.defineProperty(slider, "setPointerCapture", {
      value: vi.fn(),
      configurable: true,
    });
    vi.spyOn(slider, "getBoundingClientRect").mockReturnValue({
      x: left,
      y: 0,
      width,
      height: 20,
      top: 0,
      left,
      right: left + width,
      bottom: 20,
      toJSON: () => ({}),
    });
    return slider;
  };

  it("renders disabled slider semantics when there is no current song", () => {
    render(
      <WaveProgressBar
        seek={vi.fn()}
        getPosition={vi.fn(() => 0)}
        duration={120}
      />,
    );

    const slider = screen.getByRole("slider", { name: "Seek" });
    expect(slider).toHaveAttribute("tabindex", "-1");
    expect(slider).toHaveAttribute("aria-valuenow", "0");
  });

  it("ignores pointer seek when song is missing", () => {
    const seek = vi.fn();
    render(<WaveProgressBar seek={seek} getPosition={vi.fn(() => 0)} />);

    const slider = screen.getByRole("slider", { name: "Seek" });
    fireEvent.pointerDown(slider, { clientX: 100, pointerId: 1 });
    fireEvent.pointerUp(slider, { clientX: 120, pointerId: 1 });

    expect(seek).not.toHaveBeenCalled();
  });

  it("updates position while dragging and seeks on pointer up", () => {
    const seek = vi.fn();
    render(
      <WaveProgressBar
        currentSong={{ id: 9, duration: 100 }}
        duration={100}
        seek={seek}
        getPosition={vi.fn(() => 0)}
      />,
    );

    const slider = setupMockSlider(200, 0);

    fireEvent.pointerDown(slider, { clientX: 50, pointerId: 11 });
    expect(slider).toHaveAttribute("aria-valuenow", "25");

    fireEvent.pointerMove(slider, { clientX: 100, pointerId: 11 });
    expect(slider).toHaveAttribute("aria-valuenow", "50");

    fireEvent.pointerUp(slider, { clientX: 120, pointerId: 11 });
    expect(seek).toHaveBeenCalledWith(60);
    expect(slider).toHaveAttribute("aria-valuenow", "60");
  });

  it("clamps position to 0 when dragging out of bounds to the left", () => {
    const seek = vi.fn();
    render(
      <WaveProgressBar
        currentSong={{ id: 9, duration: 100 }}
        duration={100}
        seek={seek}
        getPosition={vi.fn(() => 0)}
      />,
    );

    const slider = setupMockSlider(200, 50); // slider starts at x=50

    // Drag way outside to the left
    fireEvent.pointerDown(slider, { clientX: -50, pointerId: 12 });
    expect(slider).toHaveAttribute("aria-valuenow", "0");

    fireEvent.pointerUp(slider, { clientX: -50, pointerId: 12 });
    expect(seek).toHaveBeenCalledWith(0);
  });

  it("clamps position to max duration when dragging out of bounds to the right", () => {
    const seek = vi.fn();
    render(
      <WaveProgressBar
        currentSong={{ id: 9, duration: 100 }}
        duration={100}
        seek={seek}
        getPosition={vi.fn(() => 0)}
      />,
    );

    const slider = setupMockSlider(200, 0);

    // Drag way outside to the right
    fireEvent.pointerDown(slider, { clientX: 500, pointerId: 13 });
    expect(slider).toHaveAttribute("aria-valuenow", "100");

    fireEvent.pointerUp(slider, { clientX: 500, pointerId: 13 });
    expect(seek).toHaveBeenCalledWith(100);
  });

  it("handles division by zero gracefully when container width is 0", () => {
    const seek = vi.fn();
    render(
      <WaveProgressBar
        currentSong={{ id: 9, duration: 100 }}
        duration={100}
        seek={seek}
        getPosition={vi.fn(() => 0)}
      />,
    );

    const slider = setupMockSlider(0, 0);

    fireEvent.pointerDown(slider, { clientX: 50, pointerId: 14 });
    expect(slider).toHaveAttribute("aria-valuenow", "0");
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
    expect(screen.getByRole("slider", { name: "Seek" })).toHaveAttribute(
      "aria-valuenow",
      "42",
    );
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
});
