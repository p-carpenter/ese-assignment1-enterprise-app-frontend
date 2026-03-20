import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Sidebar } from "./Sidebar";
import { AuthContext } from "@/shared/context/AuthContext";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthContext.Provider
          value={{
            user: {
              id: 1,
              username: "testuser",
              email: "test@example.com",
              avatar_url: "",
            },
            loading: false,
            setUser: vi.fn(),
            refreshUser: vi.fn(),
            login: vi.fn(),
            logout: vi.fn(),
          }}
        >
          {ui}
        </AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("Sidebar", () => {
  it("renders the sidebar with its child components", () => {
    renderWithProviders(<Sidebar />);

    expect(screen.getByText("Loading playlists...")).toBeInTheDocument();

    expect(screen.getByText("testuser")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /log out/i }),
    ).toBeInTheDocument();
  });
});
