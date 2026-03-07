/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe } from "@/features/auth/api";
import { type UserProfile } from "@/features/auth/types";
import { queryKeys } from "@/shared/lib/queryKeys";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: user = null, isLoading: loading } = useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
    // Don't throw on 401 (not logged in) – just return null
    throwOnError: false,
    staleTime: 5 * 60 * 1000,
  });

  /** Immediately write a user object into the cache (e.g. after profile update). */
  const setUser = (newUser: UserProfile | null) => {
    queryClient.setQueryData(queryKeys.me, newUser);
  };

  /** Refetch the current user from the server. */
  const refreshUser = () =>
    queryClient.refetchQueries({ queryKey: queryKeys.me });

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
