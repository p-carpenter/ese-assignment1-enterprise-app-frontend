import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  isAuthenticated: boolean;
}

/**
 * Protects routes by redirecting unauthenticated users to `/login`.
 * @param children Protected content to render when authenticated.
 * @param isAuthenticated Whether the current user is authenticated.
 * @returns The children when authenticated, otherwise a `<Navigate />`.
 */
export const ProtectedRoute = ({
  children,
  isAuthenticated,
}: ProtectedRouteProps) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
