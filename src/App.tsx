import { useState, useEffect, type JSX } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { UploadPage } from './pages/UploadPage';
import { ProfilePage } from './pages/ProfilePage';
import LoginForm from './components/auth/LoginForm';
import RegistrationForm from './components/auth/RegistrationForm';
import { api } from './services/api';
import { type UserProfile } from './types';
import './App.css';

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
        api.me()
            .then(() => {
                setIsAuthenticated(true);
                // Fetch user profile
                return api.getProfile();
            })
            .then(profile => {
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
        api.getProfile()
            .then((profile: UserProfile) => setUserProfile(profile))
            .catch((err: unknown) => console.error('Failed to fetch profile:', err));
    };

    const handleLogout = (): void => {
        setIsAuthenticated(false);
        setUserProfile(null);
    };

    const getUserInitial = (): string => {
        if (!userProfile) return 'U';
        const displayName = userProfile.profile?.display_name || userProfile.username;
        return displayName
    };

    const getAvatarUrl = (): string | undefined => {
        return userProfile?.profile?.avatar_url;
    };

    if (isLoading) {
        return (
            <div className="app-container">
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--spotify-gray)' }}>
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
                                <>
                                    <div className="app-header">
                                        <h1 className="app-title">Music Player</h1>
                                    </div>
                                    <LoginForm onSuccess={handleAuthSuccess} />
                                </>
                            )
                        } 
                    />
                    <Route 
                        path="/register" 
                        element={
                            isAuthenticated ? (
                                <Navigate to="/" replace />
                            ) : (
                                <>
                                    <div className="app-header">
                                        <h1 className="app-title">Music Player</h1>
                                    </div>
                                    <RegistrationForm onSuccess={handleAuthSuccess} />
                                </>
                            )
                        } 
                    />

                    {/* Protected Routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute isAuthenticated={isAuthenticated}>
                                <HomePage 
                                    onLogout={handleLogout}
                                    userInitial={getUserInitial()}
                                    avatarUrl={getAvatarUrl()}
                                />
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
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;