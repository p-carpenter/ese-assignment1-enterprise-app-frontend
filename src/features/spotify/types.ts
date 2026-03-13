/** A track returned by the Spotify search API. */
export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string; // e.g. "spotify:track:4iV5W9..."
  duration_ms: number;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    release_date: string; // "2023" or "2023-05-01"
    images: Array<{ url: string; width: number; height: number }>;
  };
  preview_url: string | null;
}

export interface SpotifySearchResult {
  tracks: {
    items: SpotifyTrack[];
  };
}

export interface SpotifyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  token_type: string;
}

/** SDK player state emitted by player_state_changed */
export interface SpotifyPlayerState {
  paused: boolean;
  position: number; // ms
  duration: number; // ms
  track_window: {
    current_track: {
      id: string;
      name: string;
      uri: string;
      artists: Array<{ name: string }>;
      album: { name: string; images: Array<{ url: string }> };
    };
  };
}

/** Window-level Spotify object injected by the SDK script */
declare global {
  interface Window {
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifySDKPlayer;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export interface SpotifySDKPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, cb: (data: unknown) => void) => void;
  removeListener: (event: string, cb?: (data: unknown) => void) => void;
  getCurrentState: () => Promise<SpotifyPlayerState | null>;
  setVolume: (volume: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (positionMs: number) => Promise<void>;
  previousTrack: () => Promise<void>;
  nextTrack: () => Promise<void>;
}
