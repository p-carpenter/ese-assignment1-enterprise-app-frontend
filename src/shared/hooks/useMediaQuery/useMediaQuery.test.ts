import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useMediaQuery } from "./useMediaQuery";

describe("useMediaQuery", () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let changeListeners: Record<string, ((e: Event) => void)[]> = {};

  beforeEach(() => {
    changeListeners = {};

    // Mock the window.matchMedia API.
    matchMediaMock = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn((event, callback) => {
        if (!changeListeners[query]) changeListeners[query] = [];
        changeListeners[query].push(callback);
      }),
      removeEventListener: vi.fn((event, callback) => {
        changeListeners[query] = changeListeners[query].filter(
          (cb) => cb !== callback,
        );
      }),
      dispatchEvent: vi.fn(),
    }));

    vi.stubGlobal("matchMedia", matchMediaMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the initial match state", () => {
    matchMediaMock.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const { result } = renderHook(() => useMediaQuery("(max-width: 920px)"));

    expect(result.current).toBe(true);
  });

  it("updates when the media query change event fires", () => {
    const mediaQueryObj = {
      matches: false,
      addEventListener: vi.fn((e, cb) => {
        changeListeners["(max-width: 920px)"] = [cb];
      }),
      removeEventListener: vi.fn(),
    };
    matchMediaMock.mockReturnValue(mediaQueryObj);

    const { result } = renderHook(() => useMediaQuery("(max-width: 920px)"));
    expect(result.current).toBe(false);

    // Simulate the browser viewport resizing and triggering the event.
    act(() => {
      mediaQueryObj.matches = true;
      const listeners = changeListeners["(max-width: 920px)"] || [];
      listeners.forEach((cb) => cb(new Event("change")));
    });

    expect(result.current).toBe(true);
  });

  it("cleans up event listeners on unmount", () => {
    const removeEventListenerMock = vi.fn();
    matchMediaMock.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: removeEventListenerMock,
    });

    const { unmount } = renderHook(() => useMediaQuery("(max-width: 920px)"));

    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledTimes(1);
    expect(removeEventListenerMock).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });
});
