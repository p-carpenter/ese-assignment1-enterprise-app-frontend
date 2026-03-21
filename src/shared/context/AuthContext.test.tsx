import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import {
  getMe,
  login as loginApi,
  logout as logoutApi,
} from "@/features/auth/api";
import { queryKeys } from "@/shared/lib/queryKeys";
import type { UserProfile } from "@/features/auth/types";
import { type ReactNode } from "react";

// Mock the API calls.
vi.mock("@/features/auth/api", () => ({
  getMe: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

const mockUser: UserProfile = {
  id: 1,
  email: "test@example.com",
  username: "testuser",
};

describe("AuthContext", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    // Start with a fresh query client for every test to prevent state leakage.
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );

  it("throws a fatal error if useAuth is consumed outside the provider", () => {
    // Suppress React's error boundary console noise for this specific test.
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used within AuthProvider",
    );

    consoleError.mockRestore();
  });

  it("fetches the user on mount and transitions from loading to populated state", async () => {
    vi.mocked(getMe).mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initial state before query resolves.
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(getMe).toHaveBeenCalledTimes(1);
  });

  it("handles unauthenticated users gracefully without throwing", async () => {
    vi.mocked(getMe).mockRejectedValueOnce(new Error("401 Unauthorised"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it("calls the login API and forces a query refetch", async () => {
    vi.mocked(getMe)
      .mockRejectedValueOnce(new Error("401 Unauthorised"))
      .mockResolvedValueOnce(mockUser);
    vi.mocked(loginApi).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login("test@example.com", "password123");
    });

    expect(loginApi).toHaveBeenCalledWith("test@example.com", "password123");
    expect(getMe).toHaveBeenCalledTimes(2);

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
  });

  it("executes logout, clears the user synchronously, and purges all unrelated query cache", async () => {
    vi.mocked(getMe).mockResolvedValueOnce(mockUser);
    vi.mocked(logoutApi).mockResolvedValueOnce(undefined);

    queryClient.setQueryData(
      ["playlists", "user-123"],
      [{ id: 1, name: "Vibes" }],
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).toEqual(mockUser));

    await act(async () => {
      await result.current.logout();
    });

    expect(logoutApi).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });

    // The underlying query client data should be cleared.
    expect(queryClient.getQueryData(queryKeys.me)).toBeNull();
    expect(queryClient.getQueryData(["playlists", "user-123"])).toBeUndefined();
  });

  it("synchronously writes cache data when setUser is called manually", async () => {
    vi.mocked(getMe).mockRejectedValueOnce(new Error("401 Unauthorized"));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setUser(mockUser);
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
    expect(queryClient.getQueryData(queryKeys.me)).toEqual(mockUser);
  });

  it("triggers a manual refetch via refreshUser", async () => {
    const updatedUser = { ...mockUser, username: "new-username" };

    vi.mocked(getMe)
      .mockResolvedValueOnce(mockUser)
      .mockResolvedValueOnce(updatedUser);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(mockUser));

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(getMe).toHaveBeenCalledTimes(2);

    await waitFor(() => {
      expect(result.current.user).toEqual(updatedUser);
    });
  });
});
