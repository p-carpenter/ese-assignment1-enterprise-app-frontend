import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import { queryKeys } from "@/shared/lib/queryKeys";
import { type ReactNode } from "react";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { resetHandlerState } from "@/mocks/handlers";

describe("AuthContext", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    resetHandlerState();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );

  it("throws a fatal error if useAuth is consumed outside the provider", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      "useAuth must be used within AuthProvider",
    );
    consoleError.mockRestore();
  });

  it("fetches the user on mount and transitions from loading to populated state", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user?.username).toBe("testuser");
  });

  it("handles unauthenticated users gracefully without throwing", async () => {
    server.use(
      http.get(
        "http://localhost:8000/api/auth/user/",
        () => new HttpResponse(null, { status: 401 }),
      ),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });

  it("calls the login API and populates user", async () => {
    server.use(
      http.get(
        "http://localhost:8000/api/auth/user/",
        () => new HttpResponse(null, { status: 401 }),
      ),
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    server.use(
      http.get("http://localhost:8000/api/auth/user/", () =>
        HttpResponse.json({
          id: 1,
          username: "testuser",
          email: "test@test.com",
        }),
      ),
    );

    await act(async () => {
      await result.current.login("test@example.com", "password123");
    });

    await waitFor(() => {
      expect(result.current.user?.username).toBe("testuser");
    });
  });

  it("executes logout, clears the user synchronously, and purges all unrelated query cache", async () => {
    queryClient.setQueryData(
      ["playlists", "user-1"],
      [{ id: 1, name: "Vibes" }],
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user?.username).toBe("testuser"));

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });

    expect(queryClient.getQueryData(queryKeys.me)).toBeNull();
    expect(queryClient.getQueryData(["playlists", "user-1"])).toBeUndefined();
  });

  it("setUser immediately updates the user in cache", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setUser({
        id: 2,
        username: "newuser",
        email: "new@user.com",
      });
    });

    await waitFor(() => {
      expect(result.current.user).toEqual({
        id: 2,
        username: "newuser",
        email: "new@user.com",
      });
    });
    expect(queryClient.getQueryData(queryKeys.me)).toEqual({
      id: 2,
      username: "newuser",
      email: "new@user.com",
    });
  });

  it("refreshUser refetches the user from the server", async () => {
    // Set initial user to null
    queryClient.setQueryData(queryKeys.me, null);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Mock server to return a new user on refetch
    server.use(
      http.get("http://localhost:8000/api/auth/user/", () =>
        HttpResponse.json({
          id: 3,
          username: "refetched",
          email: "refetch@user.com",
        }),
      ),
    );

    await act(async () => {
      await result.current.refreshUser();
    });

    await waitFor(() => {
      expect(result.current.user).toEqual({
        id: 3,
        username: "refetched",
        email: "refetch@user.com",
      });
    });
    expect(queryClient.getQueryData(queryKeys.me)).toEqual({
      id: 3,
      username: "refetched",
      email: "refetch@user.com",
    });
  });
});
