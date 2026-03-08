import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import { App } from "./App.tsx";
import { AudioPlayerProvider } from "react-use-audio-player";
import { AuthProvider } from "@/shared/context/AuthContext";
import { PlayerProvider } from "@/features/player";
import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
} from "@tanstack/react-query";
import { ApiError } from "@/shared/api/errors";

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      const errorMessage =
        error instanceof ApiError
          ? error.getReadableMessage()
          : error.message || "An unexpected error occurred.";

      console.error("[Mutation Error]:", errorMessage);
    },
  }),

  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 10000 * 60,
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
