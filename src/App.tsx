import { useState, useEffect, type JSX } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AppRoutes } from "./routes";

import { type UserProfile } from "@/features/auth/types";
import "./App.css";
import { getMe } from "@/features/auth/api";

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
    getMe()
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
    getMe()
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
        <AppRoutes
          isAuthenticated={isAuthenticated}
          onAuthSuccess={handleAuthSuccess}
          onLogout={handleLogout}
          userProfile={userProfile}
          userInitial={getUserInitial()}
          avatarUrl={getAvatarUrl()}
          onPasswordResetSuccess={() => setIsAuthenticated(false)}
        />
      </div>
    </Router>
  );
};

export default App;
