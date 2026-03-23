import { vi } from "vitest";
import type { PlayerContextType } from "@/shared/context/PlayerContext";
import { createSong } from "./song";

export const createMockPlayer = (
  overrides: Partial<PlayerContextType> = {},
): PlayerContextType => {
  const defaultPlaylist = [createSong({ id: 1 })];

  return {
    currentSong: null,
    playlist: defaultPlaylist,

    isPlaying: false,
    isLoading: false,
    isLooping: false,

    duration: 0,
    volume: 1,

    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
    getPosition: vi.fn(() => 0),

    setVolume: vi.fn(),
    setPlaylist: vi.fn(),

    playSong: vi.fn(async () => {}),
    playPrev: vi.fn(async () => {}),
    playNext: vi.fn(async () => {}),

    toggleLoop: vi.fn(),

    ...overrides,
  };
};
