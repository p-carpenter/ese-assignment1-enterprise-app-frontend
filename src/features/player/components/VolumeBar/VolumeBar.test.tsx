import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { VolumeBar } from "./VolumeBar";
import { usePlayer } from "@/shared/context/PlayerContext";
import type { PlayerContextType } from "@/shared/context/PlayerContext";

vi.mock("@/shared/context/PlayerContext", () => ({
  usePlayer: vi.fn(),
}));

describe("VolumeBar", () => {
  const setVolume = vi.fn();

  const defaultPlayerContext: PlayerContextType = {
    volume: 0.4,
    setVolume,
    currentSong: null,
    playlist: [],
    isPlaying: false,
    isLoading: false,
    isLooping: false,
    duration: 0,
    play: vi.fn(),
    pause: vi.fn(),
    playPrev: vi.fn(async () => {}),
    playNext: vi.fn(async () => {}),
    seek: vi.fn(),
    getPosition: vi.fn(() => 0),
    toggleLoop: vi.fn(),
    setPlaylist: vi.fn(),
    playSong: vi.fn(async () => {}),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePlayer).mockReturnValue(defaultPlayerContext);
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

    const slider = screen.getByRole("slider", { name: "Volume" });
    expect(slider).toHaveAttribute(
      "style",
      expect.stringContaining("--vol: 0.4"),
    );
  });
});
