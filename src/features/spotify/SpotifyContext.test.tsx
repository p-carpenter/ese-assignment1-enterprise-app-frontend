import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { SpotifyProvider, useSpotify } from "./SpotifyContext";
import "@testing-library/jest-dom/vitest";

// ── Mock auth & api modules ───────────────────────────────────────────────────
vi.mock("./auth", () => ({
  getValidAccessToken: vi.fn().mockResolvedValue("fake-token"),
  clearCachedToken: vi.fn(),
}));
vi.mock("./api", () => ({
  playOnDevice: vi.fn().mockResolvedValue(undefined),
}));

import { clearCachedToken } from "./auth";
import { playOnDevice } from "./api";
const mockClearToken = vi.mocked(clearCachedToken);
const mockPlayOnDevice = vi.mocked(playOnDevice);

// ── SDK Player mock factory ───────────────────────────────────────────────────
type ListenerCb = (data?: unknown) => void;

const createMockPlayer = () => {
  const listeners: Record<string, ListenerCb[]> = {};
  return {
    connect: vi.fn().mockResolvedValue(true),
    disconnect: vi.fn(),
    pause: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    seek: vi.fn().mockResolvedValue(undefined),
    setVolume: vi.fn().mockResolvedValue(undefined),
    nextTrack: vi.fn().mockResolvedValue(undefined),
    previousTrack: vi.fn().mockResolvedValue(undefined),
    getCurrentState: vi.fn().mockResolvedValue(null),
    addListener: vi.fn((event: string, cb: ListenerCb) => {
      listeners[event] ??= [];
      listeners[event].push(cb);
    }) as Mock,
    removeListener: vi.fn(),
    /** Test helper: fire a registered SDK event */
    emit(event: string, data?: unknown) {
      listeners[event]?.forEach((cb) => cb(data));
    },
  };
};

let mockPlayer: ReturnType<typeof createMockPlayer>;
const SpotifyPlayerConstructor = vi.fn(function SpotifyPlayerMock(
  this: unknown,
) {
  return mockPlayer;
});

// ── SDK script injection helper ───────────────────────────────────────────────
const SDK_SCRIPT_ID = "spotify-playback-sdk";

const injectSdkScript = () => {
  const script = document.createElement("script");
  script.id = SDK_SCRIPT_ID;
  document.body.appendChild(script);
};

// ── Mount helper ─────────────────────────────────────────────────────────────
const renderSpotifyHook = () =>
  renderHook(() => useSpotify(), { wrapper: SpotifyProvider });

// ── Shared setup ─────────────────────────────────────────────────────────────
beforeEach(() => {
  mockPlayer = createMockPlayer();
  SpotifyPlayerConstructor.mockImplementation(function SpotifyPlayerMock(
    this: unknown,
  ) {
    return mockPlayer;
  });

  // Remove any leftover SDK script from previous test
  document.getElementById(SDK_SCRIPT_ID)?.remove();
  injectSdkScript();
  window.Spotify = {
    Player: SpotifyPlayerConstructor as unknown as Window["Spotify"]["Player"],
  };

  vi.clearAllMocks();

  mockPlayer.connect.mockResolvedValue(true);
  mockPlayOnDevice.mockResolvedValue(undefined);
  SpotifyPlayerConstructor.mockImplementation(function SpotifyPlayerMock(
    this: unknown,
  ) {
    return mockPlayer;
  });
});

afterEach(() => {
  document.getElementById(SDK_SCRIPT_ID)?.remove();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("useSpotify", () => {
  it("throws when used outside SpotifyProvider", () => {
    // Suppress the expected React error boundary console output
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useSpotify())).toThrow(
      "useSpotify must be used within SpotifyProvider",
    );
    spy.mockRestore();
  });
});

describe("SpotifyProvider — SDK initialization", () => {
  it("starts with isReady = false", () => {
    const { result } = renderSpotifyHook();
    expect(result.current.isReady).toBe(false);
  });

  it("calls player.connect() during initialization", async () => {
    renderSpotifyHook();
    await waitFor(() => expect(mockPlayer.connect).toHaveBeenCalledOnce());
  });

  it("sets isReady to true when the SDK fires the 'ready' event", async () => {
    const { result } = renderSpotifyHook();

    await waitFor(() => expect(mockPlayer.connect).toHaveBeenCalled());

    act(() => {
      mockPlayer.emit("ready", { device_id: "device-abc" });
    });

    expect(result.current.isReady).toBe(true);
  });

  it("reverts isReady to false on the 'not_ready' event", async () => {
    const { result } = renderSpotifyHook();

    await waitFor(() => expect(mockPlayer.connect).toHaveBeenCalled());

    act(() => {
      mockPlayer.emit("ready", { device_id: "device-abc" });
    });
    expect(result.current.isReady).toBe(true);

    act(() => {
      mockPlayer.emit("not_ready", {});
    });
    expect(result.current.isReady).toBe(false);
  });

  it("calls clearCachedToken on an 'authentication_error' event", async () => {
    renderSpotifyHook();

    await waitFor(() => expect(mockPlayer.connect).toHaveBeenCalled());

    act(() => {
      mockPlayer.emit("authentication_error", { message: "Bad token" });
    });

    expect(mockClearToken).toHaveBeenCalledOnce();
  });

  it("disconnects the player on unmount", async () => {
    const { result, unmount } = renderSpotifyHook();

    await waitFor(() => expect(mockPlayer.connect).toHaveBeenCalled());

    act(() => {
      mockPlayer.emit("ready", { device_id: "device-abc" });
    });
    expect(result.current.isReady).toBe(true);

    unmount();

    expect(mockPlayer.disconnect).toHaveBeenCalledOnce();
  });
});

describe("SpotifyProvider — player_state_changed", () => {
  it("updates isPlaying and duration from a state change event", async () => {
    const { result } = renderSpotifyHook();

    await waitFor(() => expect(mockPlayer.connect).toHaveBeenCalled());

    act(() => {
      mockPlayer.emit("ready", { device_id: "dev-1" });
    });

    act(() => {
      mockPlayer.emit("player_state_changed", {
        paused: false,
        position: 5000,
        duration: 200_000,
      });
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.duration).toBeCloseTo(200, 0); // seconds
  });

  it("fires the onTrackEnded callback when the track ends naturally", async () => {
    const { result } = renderSpotifyHook();

    await waitFor(() => expect(mockPlayer.connect).toHaveBeenCalled());

    act(() => {
      mockPlayer.emit("ready", { device_id: "dev-1" });
    });

    const onEnded = vi.fn();
    act(() => {
      result.current.setOnTrackEnded(onEnded);
    });

    // Simulate playback near the end of a 4-minute track
    act(() => {
      mockPlayer.emit("player_state_changed", {
        paused: false,
        position: 242_000, // > duration - 4000 = 241000
        duration: 245_000,
      });
    });

    // Simulate natural end: paused at position 0
    act(() => {
      mockPlayer.emit("player_state_changed", {
        paused: true,
        position: 100, // < 1500
        duration: 245_000,
      });
    });

    expect(onEnded).toHaveBeenCalledOnce();
  });

  it("does NOT fire onTrackEnded when user manually pauses mid-track", async () => {
    const { result } = renderSpotifyHook();

    await waitFor(() => expect(mockPlayer.connect).toHaveBeenCalled());

    act(() => {
      mockPlayer.emit("ready", { device_id: "dev-1" });
    });

    const onEnded = vi.fn();
    act(() => {
      result.current.setOnTrackEnded(onEnded);
    });

    // Playback at middle of track
    act(() => {
      mockPlayer.emit("player_state_changed", {
        paused: false,
        position: 60_000,
        duration: 200_000,
      });
    });

    // User pauses in the middle (position is well before end)
    act(() => {
      mockPlayer.emit("player_state_changed", {
        paused: true,
        position: 60_500, // > 1500 ms, not near end
        duration: 200_000,
      });
    });

    expect(onEnded).not.toHaveBeenCalled();
  });

  it("does NOT fire onTrackEnded after setOnTrackEnded(null) clears the callback", async () => {
    const { result } = renderSpotifyHook();

    await waitFor(() => expect(mockPlayer.connect).toHaveBeenCalled());

    act(() => {
      mockPlayer.emit("ready", { device_id: "dev-1" });
    });

    const onEnded = vi.fn();
    act(() => {
      result.current.setOnTrackEnded(onEnded);
    });
    // Clear the callback before the track ends
    act(() => {
      result.current.setOnTrackEnded(null);
    });

    // Playback near end
    act(() => {
      mockPlayer.emit("player_state_changed", {
        paused: false,
        position: 239_000,
        duration: 240_000,
      });
    });
    // Natural end
    act(() => {
      mockPlayer.emit("player_state_changed", {
        paused: true,
        position: 0,
        duration: 240_000,
      });
    });

    expect(onEnded).not.toHaveBeenCalled();
  });

  it("does not crash when player_state_changed fires with a null state", async () => {
    const { result } = renderSpotifyHook();

    await waitFor(() => expect(mockPlayer.connect).toHaveBeenCalled());

    act(() => {
      mockPlayer.emit("ready", { device_id: "dev-1" });
    });

    // This should simply return early without throwing
    expect(() => {
      act(() => {
        mockPlayer.emit("player_state_changed", null);
      });
    }).not.toThrow();

    // State should remain at defaults
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.duration).toBe(0);
  });

  it("updates positionRef and getPosition() interpolates forward while playing", async () => {
    const result = await (async () => {
      const hook = renderSpotifyHook();
      await waitFor(() => expect(mockPlayer.connect).toHaveBeenCalled());
      act(() => {
        mockPlayer.emit("ready", { device_id: "dev-1" });
      });
      return hook.result;
    })();

    const fakeNow = 1_000_000;
    // Reuse a single spy reference to avoid double-spying on Date.now
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(fakeNow);

    try {
      act(() => {
        mockPlayer.emit("player_state_changed", {
          paused: false,
          position: 10_000, // 10 s
          duration: 200_000,
        });
      });

      // Advance fake clock by 2 seconds
      nowSpy.mockReturnValue(fakeNow + 2_000);

      // Position should interpolate to ~12 s
      expect(result.current.getPosition()).toBeCloseTo(12, 0);
    } finally {
      vi.restoreAllMocks();
    }
  });
});

describe("SpotifyProvider — playback controls", () => {
  /** Shared helper: mount and bring the player to a ready state. */
  const setupReady = async () => {
    const hook = renderSpotifyHook();
    await waitFor(() => expect(mockPlayer.connect).toHaveBeenCalled());
    act(() => {
      mockPlayer.emit("ready", { device_id: "dev-ready" });
    });
    return hook.result;
  };

  it("playTrack calls playOnDevice with the URI and device id", async () => {
    const result = await setupReady();

    await act(async () => {
      await result.current.playTrack("spotify:track:xyz");
    });

    expect(mockPlayOnDevice).toHaveBeenCalledWith(
      "spotify:track:xyz",
      "dev-ready",
    );
  });

  it("playTrack throws if the player is not yet ready", async () => {
    const { result } = renderSpotifyHook();
    // Connect not yet resolved, no ready event fired
    await expect(result.current.playTrack("spotify:track:xyz")).rejects.toThrow(
      "Spotify player not ready.",
    );
  });

  it("pause calls player.pause()", async () => {
    const result = await setupReady();

    await act(async () => {
      await result.current.pause();
    });

    expect(mockPlayer.pause).toHaveBeenCalledOnce();
  });

  it("resume calls player.resume()", async () => {
    const result = await setupReady();

    await act(async () => {
      await result.current.resume();
    });

    expect(mockPlayer.resume).toHaveBeenCalledOnce();
  });

  it("seek converts seconds to ms and calls player.seek()", async () => {
    const result = await setupReady();

    await act(async () => {
      await result.current.seek(42.5);
    });

    expect(mockPlayer.seek).toHaveBeenCalledWith(42_500);
  });

  it("setVolume passes the value through to player.setVolume()", async () => {
    const result = await setupReady();

    await act(async () => {
      await result.current.setVolume(0.7);
    });

    expect(mockPlayer.setVolume).toHaveBeenCalledWith(0.7);
  });

  it("nextTrack calls player.nextTrack()", async () => {
    const result = await setupReady();

    await act(async () => {
      await result.current.nextTrack();
    });

    expect(mockPlayer.nextTrack).toHaveBeenCalledOnce();
  });

  it("prevTrack calls player.previousTrack()", async () => {
    const result = await setupReady();

    await act(async () => {
      await result.current.prevTrack();
    });

    expect(mockPlayer.previousTrack).toHaveBeenCalledOnce();
  });

  it("getPosition returns 0 when nothing has played yet", async () => {
    const { result } = renderSpotifyHook();

    expect(result.current.getPosition()).toBe(0);
  });

  it("getPosition interpolates correctly while paused", async () => {
    const result = await setupReady();

    act(() => {
      mockPlayer.emit("player_state_changed", {
        paused: true,
        position: 30_000,
        duration: 200_000,
      });
    });

    // While paused, position should be exactly the last reported value
    expect(result.current.getPosition()).toBeCloseTo(30, 0);
  });

  it("playTrack sets isLoading to true while the API call is in-flight", async () => {
    mockPlayOnDevice.mockReturnValueOnce(new Promise(() => {}));
    const result = await setupReady();

    act(() => {
      void result.current.playTrack("spotify:track:abc");
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("seek updates getPosition() immediately without waiting for a state event", async () => {
    const result = await setupReady();

    act(() => {
      mockPlayer.emit("player_state_changed", {
        paused: true,
        position: 0,
        duration: 200_000,
      });
    });

    await act(async () => {
      await result.current.seek(90);
    });

    expect(result.current.getPosition()).toBeCloseTo(90, 1);
  });
});
