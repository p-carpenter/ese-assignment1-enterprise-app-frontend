import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import { App } from "./App.tsx";
import { AudioPlayerProvider } from "react-use-audio-player";
import { AuthProvider } from "@/shared/context/AuthContext";
import { PlayerProvider } from "@/features/player";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on 401 / 403 – treat those as "not logged in"
      retry: (failureCount, error) => {
        if (
          error instanceof Error &&
          "status" in error &&
          (error as unknown as { status: number }).status < 500
        ) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 10000 * 60, // 10 minute default
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AudioPlayerProvider>
          <PlayerProvider>
            <App />
          </PlayerProvider>
        </AudioPlayerProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
