import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import { App } from "./App.tsx";
import { AudioPlayerProvider } from "react-use-audio-player";
import { AuthProvider } from "@/shared/context/AuthContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <AudioPlayerProvider>
        <App />
      </AudioPlayerProvider>
    </AuthProvider>
  </StrictMode>,
);
