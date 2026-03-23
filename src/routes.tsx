import { type JSX } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  ProtectedRoute,
  LoginPage,
  RegisterPage,
  ResetPasswordPage,
  RequestResetPasswordPage,
  ProfilePage,
  EmailVerificationPage,
} from "@/features/auth";
import { UploadPage, SongDetailsPage } from "@/features/songs";
import { HomePage } from "@/shared/HomePage/HomePage";
import { useAuth } from "@/shared/context/AuthContext";
import { PlaylistDetailPage } from "./features/playlists/pages/PlaylistDetailPage";
import { PlaylistsPage } from "./features/playlists/pages/PlaylistsPage";
import { AppLayout } from "@/shared/layout";

/**
 * Application route tree.
 * Uses authentication state to expose public and protected routes.
 * @returns The app's top-level React Router element.
 */
export const AppRoutes = (): JSX.Element => {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return (
    <Routes>
      {/* Public Routes — no persistent shell */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
        }
      />
      <Route
        path="account-confirm-email/:key"
        element={<EmailVerificationPage />}
      />
      <Route path="/reset-password" element={<RequestResetPasswordPage />} />
      <Route
        path="reset-password/confirm/:uid/:token"
        element={<ResetPasswordPage />}
      />

      {/* Protected Routes - all share the persistent AppLayout shell */}
      <Route
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/profile/edit"
          element={<ProfilePage isEditing={true} />}
        />
        <Route path="/playlists" element={<PlaylistsPage />} />
        <Route path="/playlists/:playlistId" element={<PlaylistDetailPage />} />
        <Route path="/songs/:id" element={<SongDetailsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
