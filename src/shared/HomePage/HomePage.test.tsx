import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HomePage } from "./HomePage";
import { AuthProvider } from "@/shared/context/AuthContext";
import "@testing-library/jest-dom/vitest";

// Stub heavy child components so this test focuses on page composition
vi.mock("@/features/songs", () => ({
  SongLibrary: () => <div data-testid="song-library">Song Library</div>,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the SongLibrary", () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <AuthProvider>
            <HomePage />
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByTestId("song-library")).toBeInTheDocument();
  });
});
