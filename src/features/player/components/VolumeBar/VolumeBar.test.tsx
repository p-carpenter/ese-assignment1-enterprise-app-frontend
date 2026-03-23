import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { VolumeBar } from "./VolumeBar";
import { usePlayer } from "@/shared/context/PlayerContext";
import { createMockPlayer } from "@/test/factories/player";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

vi.mock("@/shared/context/PlayerContext", () => ({
  usePlayer: vi.fn(),
}));

describe("VolumeBar", () => {
  const setVolume = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePlayer).mockReturnValue(
      createMockPlayer({ volume: 0.4, setVolume }),
    );
  });

  it("renders a volume range input with current value", () => {
    render(<VolumeBar />);

    const slider = screen.getByRole("slider", { name: "Volume" });
    expect(slider).toHaveAttribute("min", "0");
    expect(slider).toHaveAttribute("max", "1");
    expect(slider).toHaveAttribute("step", "0.01");
    expect(slider).toHaveValue("0.4");
  });

  it("calls setVolume with numeric value when slider changes", () => {
    render(<VolumeBar />);

    fireEvent.change(screen.getByRole("slider", { name: "Volume" }), {
      target: { value: "0.75" },
    });

    expect(setVolume).toHaveBeenCalledWith(0.75);
  });

  it("writes css custom property used for progress styling", () => {
    render(<VolumeBar />);

    // Check the fill element's width style.
    const fill = screen.getByTestId("volume-fill");
    expect(fill).toHaveStyle({ width: "40%" });
  });

  it("should have no accessibility violations", async () => {
    const { container } = render(<VolumeBar />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
