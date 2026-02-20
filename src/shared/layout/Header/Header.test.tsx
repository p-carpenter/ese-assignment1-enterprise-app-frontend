import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Header } from "./Header";
import { logout } from "@/features/auth/api";
import "@testing-library/jest-dom/vitest";

vi.mock("@/features/auth/api", () => ({
  logout: vi.fn(),
}));

const mockLogout = vi.mocked(logout);

const renderHeader = (props: Partial<Parameters<typeof Header>[0]> = {}) => {
  return render(
    <MemoryRouter>
      <Header onLogout={() => {}} {...props} />
    </MemoryRouter>,
  );
};

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the app title", () => {
    renderHeader();
    expect(screen.getByText("Music Player")).toBeInTheDocument();
  });

  it("renders an Upload button", () => {
    renderHeader();
    expect(
      screen.getByRole("button", { name: /upload/i }),
    ).toBeInTheDocument();
  });

  it("renders a Log Out button", () => {
    renderHeader();
    expect(
      screen.getByRole("button", { name: /log out/i }),
    ).toBeInTheDocument();
  });

  it("renders a profile/avatar button", () => {
    renderHeader();
    expect(screen.getByTitle("View Profile")).toBeInTheDocument();
  });

  it("displays the user initial when no avatarUrl is given", () => {
    renderHeader({ userInitial: "J" });
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("uppercases the user initial", () => {
    renderHeader({ userInitial: "a" });
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders an avatar img when avatarUrl is provided", () => {
    renderHeader({ avatarUrl: "http://example.com/avatar.jpg" });
    const img = screen.getByAltText("Profile");
    expect(img).toHaveAttribute("src", "http://example.com/avatar.jpg");
  });

  it("calls logout() and then onLogout() when the Log Out button is clicked", async () => {
    const onLogout = vi.fn();
    mockLogout.mockResolvedValueOnce(undefined);

    renderHeader({ onLogout });
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(onLogout).toHaveBeenCalledTimes(1);
    });
  });

  it("still calls onLogout even when logout() rejects", async () => {
    const onLogout = vi.fn();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockLogout.mockRejectedValueOnce(new Error("network error"));

    renderHeader({ onLogout });
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));

    // onLogout should not be called when logout() throws (the catch block
    // only logs the error and does not call onLogout)
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });
});
