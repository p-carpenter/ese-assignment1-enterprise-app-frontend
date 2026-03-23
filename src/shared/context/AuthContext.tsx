/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMe,
  login as loginApi,
  logout as logoutApi,
} from "@/features/auth/api";
import { type UserProfile } from "@/features/auth/types";
import { queryKeys } from "@/shared/lib/queryKeys";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  refreshUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

/**
 * Authentication context provider.
 * Provides `user`, `loading` state and auth actions to the app via context.
 * @param children React children to render within the provider.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: user = null, isLoading: loading } = useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
    // Don't throw on 401 (not logged in) – just return null
    throwOnError: false,
    staleTime: Infinity,
  });

  /**
   * Immediately write a user object into the cache (e.g. after profile update).
   * @param newUser The new user object or null to clear.
   */
  const setUser = (newUser: UserProfile | null) => {
    queryClient.setQueryData(queryKeys.me, newUser);
  };

  /**
   * Refetch the current user from the server.
   * @returns Promise resolving when refetch completes.
   */
  const refreshUser = () =>
    queryClient.refetchQueries({ queryKey: queryKeys.me });

  /**
   * Log in using email/password and refresh the cached user.
   * @param email User email.
   * @param password User password.
   */
  const login = async (email: string, password: string) => {
    await loginApi(email, password);
    await queryClient.refetchQueries({ queryKey: queryKeys.me });
  };

  /**
   * Log out the current user and clear user-specific cache.
   */
  const logout = async () => {
    await logoutApi();
    // Set user to null synchronously so ProtectedRoute redirects immediately.
    queryClient.setQueryData(queryKeys.me, null);
    // Remove all other cached queries so stale user-specific data (playlists,
    // songs, etc.) is gone and re-fetched fresh on the next login.
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] !== "me",
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, setUser, refreshUser, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access authentication context.
 * @throws If used outside of `AuthProvider`.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
