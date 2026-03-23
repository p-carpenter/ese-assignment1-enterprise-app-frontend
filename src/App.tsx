import { type JSX } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AppRoutes } from "./routes";
import { useAuth } from "@/shared/context/AuthContext";
import "./App.css";

/**
 * Root application component.
 * Waits for auth initialization then mounts routing.
 * @returns The top-level App component.
 */
export const App = (): JSX.Element => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading_text">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <AppRoutes />
      </div>
    </Router>
  );
};
