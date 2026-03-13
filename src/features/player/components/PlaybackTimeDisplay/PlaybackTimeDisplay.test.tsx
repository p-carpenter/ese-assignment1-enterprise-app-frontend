import { render, screen, act } from "@testing-library/react";
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type MockInstance,
} from "vitest";
import { PlaybackTimeDisplay } from "./PlaybackTimeDisplay";

describe("PlaybackTimeDisplay", () => {
  let rafSpy: MockInstance;
  let cancelRafSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    rafSpy = vi.spyOn(window, "requestAnimationFrame");
    cancelRafSpy = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders initial time and max duration", () => {
    const getPosition = vi.fn(() => 0);

    render(
      <PlaybackTimeDisplay
        getPosition={getPosition}
        maxDuration={125}
        isPlaying={false}
      />,
    );

    expect(screen.getByLabelText("Playback time")).toHaveTextContent(
      "0:00 / 2:05",
    );
  });

  it("handles exact 0 without relying on falsy bugs", () => {
    const getPosition = vi.fn(() => 0);

    render(
      <PlaybackTimeDisplay
        getPosition={getPosition}
        maxDuration={0}
        isPlaying={false}
      />,
    );

    expect(screen.getByLabelText("Playback time")).toHaveTextContent(
      "0:00 / 0:00",
    );
  });

  it("formats decimals correctly without overflowing seconds to 60", () => {
    const getPosition = vi.fn(() => 59.6);
    let rafCallback: FrameRequestCallback | null = null;

    rafSpy.mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });

    render(
      <PlaybackTimeDisplay
        getPosition={getPosition}
        maxDuration={120}
        isPlaying={true}
      />,
    );

    act(() => {
      if (rafCallback) rafCallback(0);
    });

    expect(screen.getByLabelText("Playback time")).toHaveTextContent(
      "1:00 / 2:00",
    );
  });

  it("handles negative values by clamping or defaulting to 0:00", () => {
    const getPosition = vi.fn(() => -10);
    let rafCallback: FrameRequestCallback | null = null;

    rafSpy.mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });

    render(
      <PlaybackTimeDisplay
        getPosition={getPosition}
        maxDuration={100}
        isPlaying={true}
      />,
    );

    act(() => {
      if (rafCallback) rafCallback(0);
    });

    expect(screen.getByLabelText("Playback time")).toHaveTextContent(
      "0:00 / 1:40",
    );
  });

  it("shows 0:00 for invalid or NaN duration values", () => {
    const getPosition = vi.fn(() => Number.NaN);

    render(
      <PlaybackTimeDisplay
        getPosition={getPosition}
        maxDuration={Number.NaN}
        isPlaying={false}
      />,
    );

    expect(screen.getByLabelText("Playback time")).toHaveTextContent(
      "0:00 / 0:00",
    );
  });

  it("updates displayed position on animation frame when playing", () => {
    const getPosition = vi.fn(() => 61.2);
    let rafCallback: FrameRequestCallback | null = null;

    rafSpy.mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });

    render(
      <PlaybackTimeDisplay
        getPosition={getPosition}
        maxDuration={125}
        isPlaying={true}
      />,
    );

    act(() => {
      if (rafCallback) rafCallback(0);
    });

    expect(getPosition).toHaveBeenCalled();
    expect(screen.getByLabelText("Playback time")).toHaveTextContent(
      "1:01 / 2:05",
    );
  });

  it("DOES NOT start requestAnimationFrame loop when paused", () => {
    const getPosition = vi.fn(() => 10);

    render(
      <PlaybackTimeDisplay
        getPosition={getPosition}
        maxDuration={125}
        isPlaying={false}
      />,
    );

    expect(screen.getByLabelText("Playback time")).toHaveTextContent(
      "0:10 / 2:05",
    );

    expect(rafSpy).not.toHaveBeenCalled();
  });

  it("cancels animation frame on unmount", () => {
    const getPosition = vi.fn(() => 10);
    rafSpy.mockReturnValue(42);

    const { unmount } = render(
      <PlaybackTimeDisplay
        getPosition={getPosition}
        maxDuration={90}
        isPlaying={true}
      />,
    );

    unmount();

    expect(cancelRafSpy).toHaveBeenCalledWith(42);
  });
});
