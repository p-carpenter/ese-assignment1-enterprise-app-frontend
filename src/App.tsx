import { useState, useEffect, type JSX } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ProtectedRoute } from "@/features/auth";
import { HomePage } from "@/features/songs";
import { UploadPage } from "@/features/songs";
import { ProfilePage } from "@/features/auth";
import { LoginPage } from "@/features/auth";
import { RegisterPage } from "@/features/auth";
import { ResetPasswordPage } from "@/features/auth";
import { RequestResetPasswordPage } from "@/features/auth";

import { api } from "./shared/api/client";
import { type UserProfile } from "./shared/types/index";
import "./App.css";

// interface AppState {
//    isAuthenticated: boolean;
//    isLoading: boolean;
//    userProfile: UserProfile | null;
// }

const App = (): JSX.Element => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    api.auth
      .me()
      .then((profile) => {
        setIsAuthenticated(true);
        setUserProfile(profile);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setUserProfile(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleAuthSuccess = (): void => {
    setIsAuthenticated(true);
    // Fetch profile after successful auth
    api.auth
      .me()
      .then((profile: UserProfile) => setUserProfile(profile))
      .catch((err: unknown) => console.error("Failed to fetch profile:", err));
  };

  const handleLogout = (): void => {
    setIsAuthenticated(false);
    setUserProfile(null);
  };

  const getUserInitial = (): string => {
    if (!userProfile) return "U";
    const displayName = userProfile.username;
    return displayName;
  };

  const getAvatarUrl = (): string | undefined => {
    return userProfile?.avatar_url;
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <div
          style={{
            textAlign: "center",
            padding: "60px",
            color: "var(--spotify-gray)",
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/" replace />
              ) : (
                <LoginPage onSuccess={handleAuthSuccess} />
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
              <RequestResetPasswordPage
                onSuccess={() => setIsAuthenticated(false)}
              />
            }
          />
          <Route
            path="reset-password/confirm/:uid/:token"
            element={
              <ResetPasswordPage onSuccess={() => setIsAuthenticated(false)} />
            }
          />
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <HomePage onLogout={handleLogout} avatarUrl={getAvatarUrl()} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <UploadPage
                  onLogout={handleLogout}
                  userInitial={getUserInitial()}
                  avatarUrl={getAvatarUrl()}
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
      </div>
    </Router>
  );
};

export default App;
