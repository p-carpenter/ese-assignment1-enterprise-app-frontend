import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { SyncedLyrics } from "./SyncedLyrics";
import type { ParsedLine } from "../../../../hooks/useLyrics";
import styles from "./SyncedLyrics.module.css";

const lines: ParsedLine[] = [
  { time: 0, text: "Line one" },
  { time: 5, text: "Line two" },
  { time: 10, text: "Line three" },
];

describe("SyncedLyrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });

    Object.defineProperty(HTMLElement.prototype, "offsetTop", {
      value: 100,
      writable: true,
      configurable: true,
    });

    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      value: 50,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders lyric lines and applies active/past classes from playback position", () => {
    render(<SyncedLyrics lines={lines} position={6} />);

    const lineOne = screen.getByText("Line one");
    const lineTwo = screen.getByText("Line two");
    const lineThree = screen.getByText("Line three");

    expect(lineOne).toBeInTheDocument();
    expect(lineTwo).toBeInTheDocument();
    expect(lineThree).toBeInTheDocument();

    expect(lineOne.className).toContain(styles.past);
    expect(lineTwo.className).toContain(styles.active);
    expect(lineThree.className).not.toContain(styles.active);
  });

  it("calculates explicit scroll position and calls scrollTo on container when active index changes", () => {
    const scrollToSpy = vi.spyOn(HTMLElement.prototype, "scrollTo");

    const { rerender } = render(<SyncedLyrics lines={lines} position={1} />);

    rerender(<SyncedLyrics lines={lines} position={11} />);

    expect(scrollToSpy).toHaveBeenCalled();

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 100,
      behavior: "smooth",
    });
  });
});
