import { type JSX } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AppRoutes } from "./routes";
import { useAuth } from "@/shared/context/AuthContext"; // <-- Add this
import "./App.css";

export const App = (): JSX.Element => {
  const { loading } = useAuth();

  if (loading) {
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
        <AppRoutes />
      </div>
    </Router>
  );
};
