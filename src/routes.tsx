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
import { useAuth } from "@/shared/context/AuthContext";
import { EmailVerificationPage } from "./features/auth/pages/EmailVerificationPage/EmailVerificationPage";

export const AppRoutes = (): JSX.Element => {
  const { user } = useAuth();

  // If user exists, they are authenticated
  const isAuthenticated = !!user;

  return (
    <Routes>
      {/* Public Routes */}
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

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <UploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <ProfilePage isEditing={true} />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
