import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import { App } from "./App.tsx";
import { AudioPlayerProvider } from "react-use-audio-player";
import { AuthProvider } from "@/shared/context/AuthContext";
import { PlayerProvider } from "@/features/player";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <AudioPlayerProvider>
        <PlayerProvider>
          <App />
        </PlayerProvider>
      </AudioPlayerProvider>
    </AuthProvider>
  </StrictMode>,
);
