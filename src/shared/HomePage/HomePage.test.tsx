import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HomePage } from "./HomePage";
import { AuthProvider } from "@/shared/context/AuthContext";
import "@testing-library/jest-dom/vitest";

// Stub heavy child components so this test focuses on page composition
vi.mock("@/features/songs", () => ({
  SongLibrary: () => <div data-testid="song-library">Song Library</div>,
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the SongLibrary", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <HomePage />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("song-library")).toBeInTheDocument();
  });
});
