import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useIsOverflowing } from "./useOverflow";
import type { RefObject } from "react";

type ResizeCb = () => void;

let resizeCallback: ResizeCb | null = null;
const observeSpy = vi.fn<(target: Element) => void>();
const unobserveSpy = vi.fn<(target: Element) => void>();
const disconnectSpy = vi.fn<() => void>();

const makeRef = (
  element: HTMLElement | null,
): RefObject<HTMLElement | null> => ({
  current: element,
});

class MockResizeObserver implements ResizeObserver {
  constructor(cb: ResizeObserverCallback) {
    resizeCallback = () => cb([], this);
  }

  observe = observeSpy;
  unobserve = unobserveSpy;
  disconnect = disconnectSpy;
  takeRecords = (): ResizeObserverEntry[] => [];
}

describe("useIsOverflowing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resizeCallback = null;
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when ref has no element", () => {
    const ref = makeRef(null);
    const { result } = renderHook(() => useIsOverflowing(ref));

    expect(result.current).toBe(false);
    expect(observeSpy).not.toHaveBeenCalled();
  });

  it("returns false when element has no parent", () => {
    const el = document.createElement("span");
    const ref = makeRef(el);
    const { result } = renderHook(() => useIsOverflowing(ref));

    expect(result.current).toBe(false);
    expect(observeSpy).not.toHaveBeenCalled();
  });

  it("detects overflow when child scrollWidth exceeds parent width", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);

    Object.defineProperty(parent, "clientWidth", {
      value: 100,
      configurable: true,
    });
    Object.defineProperty(child, "scrollWidth", {
      value: 200,
      configurable: true,
    });

    const ref = makeRef(child);
    const { result } = renderHook(() => useIsOverflowing(ref));

    expect(result.current).toBe(true);
    expect(observeSpy).toHaveBeenCalledWith(parent);
    expect(observeSpy).toHaveBeenCalledWith(child);
  });

  it("returns false when child scrollWidth exactly matches parent width", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);

    Object.defineProperty(parent, "clientWidth", {
      value: 150,
      configurable: true,
    });
    Object.defineProperty(child, "scrollWidth", {
      value: 150,
      configurable: true,
    });

    const ref = makeRef(child);
    const { result } = renderHook(() => useIsOverflowing(ref));

    expect(result.current).toBe(false);
  });

  it("updates overflow state when ResizeObserver fires", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);

    let parentWidth = 120;
    let childWidth = 100;

    Object.defineProperty(parent, "clientWidth", {
      get: () => parentWidth,
      configurable: true,
    });
    Object.defineProperty(child, "scrollWidth", {
      get: () => childWidth,
      configurable: true,
    });

    const ref = makeRef(child);
    const { result } = renderHook(() => useIsOverflowing(ref));

    expect(result.current).toBe(false);

    childWidth = 180;
    act(() => {
      resizeCallback?.();
    });
    expect(result.current).toBe(true);

    parentWidth = 200;
    act(() => {
      resizeCallback?.();
    });
    expect(result.current).toBe(false);
  });

  it("re-runs overflow check when dependencies change", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);

    Object.defineProperty(parent, "clientWidth", {
      value: 100,
      configurable: true,
    });
    let childWidth = 50;
    Object.defineProperty(child, "scrollWidth", {
      get: () => childWidth,
      configurable: true,
    });

    const ref = makeRef(child);

    const { result, rerender } = renderHook(
      ({ deps }) => useIsOverflowing(ref, deps),
      { initialProps: { deps: ["foo"] } },
    );

    expect(result.current).toBe(false);

    childWidth = 150;

    rerender({ deps: ["bar"] });

    expect(result.current).toBe(true);
  });

  it("disconnects observer on unmount", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);

    Object.defineProperty(parent, "clientWidth", {
      value: 120,
      configurable: true,
    });
    Object.defineProperty(child, "scrollWidth", {
      value: 180,
      configurable: true,
    });

    const ref = makeRef(child);
    const { unmount } = renderHook(() => useIsOverflowing(ref));

    unmount();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  it("disconnects and re-observes when dependencies change", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);

    Object.defineProperty(parent, "clientWidth", {
      value: 120,
      configurable: true,
    });
    Object.defineProperty(child, "scrollWidth", {
      value: 180,
      configurable: true,
    });

    const ref = makeRef(child);

    const { rerender } = renderHook(({ deps }) => useIsOverflowing(ref, deps), {
      initialProps: { deps: ["first"] as string[] },
    });

    expect(observeSpy).toHaveBeenCalledTimes(2);

    rerender({ deps: ["second"] });

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
    expect(observeSpy).toHaveBeenCalledTimes(4);
  });
});
