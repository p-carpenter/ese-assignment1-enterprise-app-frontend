import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PlaybackControls } from "./PlaybackControls";
import "@testing-library/jest-dom/vitest";

const makeProps = (
  overrides: Partial<Parameters<typeof PlaybackControls>[0]> = {},
) => ({
  isPlaying: false,
  isLoading: false,
  onPlay: vi.fn(),
  onPause: vi.fn(),
  onPrev: vi.fn(),
  onNext: vi.fn(),
  disablePrev: false,
  disableNext: false,
  ...overrides,
});

describe("PlaybackControls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders a Previous, Play/Pause, and Next button", () => {
      render(<PlaybackControls {...makeProps()} />);
      expect(
        screen.getByRole("button", { name: "Previous" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    });

    it("shows the Play aria-label when isPlaying=false", () => {
      render(<PlaybackControls {...makeProps({ isPlaying: false })} />);
      expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    });

    it("shows the Pause aria-label when isPlaying=true", () => {
      render(<PlaybackControls {...makeProps({ isPlaying: true })} />);
      expect(
        screen.getByRole("button", { name: "Pause" }),
      ).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onPlay when the Play button is clicked", () => {
      const onPlay = vi.fn();
      render(<PlaybackControls {...makeProps({ onPlay })} />);
      fireEvent.click(screen.getByRole("button", { name: "Play" }));
      expect(onPlay).toHaveBeenCalledTimes(1);
    });

    it("calls onPause when the Pause button is clicked", () => {
      const onPause = vi.fn();
      render(<PlaybackControls {...makeProps({ isPlaying: true, onPause })} />);
      fireEvent.click(screen.getByRole("button", { name: "Pause" }));
      expect(onPause).toHaveBeenCalledTimes(1);
    });

    it("calls onPrev when the Previous button is clicked", () => {
      const onPrev = vi.fn();
      render(<PlaybackControls {...makeProps({ onPrev })} />);
      fireEvent.click(screen.getByRole("button", { name: "Previous" }));
      expect(onPrev).toHaveBeenCalledTimes(1);
    });

    it("calls onNext when the Next button is clicked", () => {
      const onNext = vi.fn();
      render(<PlaybackControls {...makeProps({ onNext })} />);
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  describe("disabled states", () => {
    it("disables the Previous button when disablePrev=true", () => {
      render(<PlaybackControls {...makeProps({ disablePrev: true })} />);
      expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    });

    it("disables the Next button when disableNext=true", () => {
      render(<PlaybackControls {...makeProps({ disableNext: true })} />);
      expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    });

    it("disables all three buttons when isLoading=true", () => {
      render(<PlaybackControls {...makeProps({ isLoading: true })} />);
      screen.getAllByRole("button").forEach((btn) => {
        expect(btn).toBeDisabled();
      });
    });

    it("disables Previous even when disablePrev=false but isLoading=true", () => {
      render(
        <PlaybackControls
          {...makeProps({ isLoading: true, disablePrev: false })}
        />,
      );
      expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    });
  });
});
