import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { PlaybackControls } from "./PlaybackControls";
import "@testing-library/jest-dom/vitest";

expect.extend(toHaveNoViolations);

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

  describe("accessibility", () => {
    it("should have no accessibility violations", async () => {
      const { container } = render(<PlaybackControls {...makeProps()} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
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
      expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onPlay when the Play button is clicked", async () => {
      const user = userEvent.setup();
      const onPlay = vi.fn();

      render(<PlaybackControls {...makeProps({ onPlay })} />);

      await user.click(screen.getByRole("button", { name: "Play" }));
      expect(onPlay).toHaveBeenCalledTimes(1);
    });

    it("calls onPause when the Pause button is clicked", async () => {
      const user = userEvent.setup();
      const onPause = vi.fn();

      render(<PlaybackControls {...makeProps({ isPlaying: true, onPause })} />);

      await user.click(screen.getByRole("button", { name: "Pause" }));
      expect(onPause).toHaveBeenCalledTimes(1);
    });

    it("calls onPrev when the Previous button is clicked", async () => {
      const user = userEvent.setup();
      const onPrev = vi.fn();

      render(<PlaybackControls {...makeProps({ onPrev })} />);

      await user.click(screen.getByRole("button", { name: "Previous" }));
      expect(onPrev).toHaveBeenCalledTimes(1);
    });

    it("calls onNext when the Next button is clicked", async () => {
      const user = userEvent.setup();
      const onNext = vi.fn();

      render(<PlaybackControls {...makeProps({ onNext })} />);

      await user.click(screen.getByRole("button", { name: "Next" }));
      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  describe("disabled and loading edge cases", () => {
    it("disables the Previous button and prevents callbacks when disablePrev=true", () => {
      const onPrev = vi.fn();
      render(
        <PlaybackControls {...makeProps({ disablePrev: true, onPrev })} />,
      );

      const prevBtn = screen.getByRole("button", { name: "Previous" });
      expect(prevBtn).toBeDisabled();

      fireEvent.click(prevBtn);
      expect(onPrev).not.toHaveBeenCalled();
    });

    it("disables the Next button and prevents callbacks when disableNext=true", () => {
      const onNext = vi.fn();
      render(
        <PlaybackControls {...makeProps({ disableNext: true, onNext })} />,
      );

      const nextBtn = screen.getByRole("button", { name: "Next" });
      expect(nextBtn).toBeDisabled();

      fireEvent.click(nextBtn);
      expect(onNext).not.toHaveBeenCalled();
    });

    it("disables all buttons and prevents callbacks when isLoading=true", () => {
      const onPlay = vi.fn();
      const onPrev = vi.fn();
      const onNext = vi.fn();

      render(
        <PlaybackControls
          {...makeProps({ isLoading: true, onPlay, onPrev, onNext })}
        />,
      );

      const buttons = screen.getAllByRole("button");
      buttons.forEach((btn) => {
        expect(btn).toBeDisabled();
        fireEvent.click(btn);
      });

      expect(onPlay).not.toHaveBeenCalled();
      expect(onPrev).not.toHaveBeenCalled();
      expect(onNext).not.toHaveBeenCalled();
    });
  });
});
