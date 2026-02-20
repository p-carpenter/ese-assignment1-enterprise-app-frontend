import { type JSX } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  ProtectedRoute,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  RequestResetPasswordPage,
  ProfilePage,
} from "@/features/auth";
import { HomePage, UploadPage } from "@/features/songs";
import { type UserProfile } from "@/features/auth/types";

type AppRoutesProps = {
  isAuthenticated: boolean;
  onAuthSuccess: () => void;
  onLogout: () => void;
  userProfile: UserProfile | null;
  userInitial: string;
  avatarUrl?: string;
  onPasswordResetSuccess: () => void;
};

export const AppRoutes = ({
  isAuthenticated,
  onAuthSuccess,
  onLogout,
  userProfile,
  userInitial,
  avatarUrl,
  onPasswordResetSuccess,
}: AppRoutesProps): JSX.Element => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage onSuccess={onAuthSuccess} />
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
        }
      />
      <Route
        path="/reset-password"
        element={
          <RequestResetPasswordPage onSuccess={onPasswordResetSuccess} />
        }
      />
      <Route
        path="reset-password/confirm/:uid/:token"
        element={<ResetPasswordPage onSuccess={onPasswordResetSuccess} />}
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <HomePage onLogout={onLogout} avatarUrl={avatarUrl} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <UploadPage
              onLogout={onLogout}
              userInitial={userInitial}
              avatarUrl={avatarUrl}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ProfilePage profile={userProfile} />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
