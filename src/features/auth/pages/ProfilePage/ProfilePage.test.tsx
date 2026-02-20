import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProfilePage } from "./ProfilePage";
import "@testing-library/jest-dom/vitest";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderProfile = (
  profile: Parameters<typeof ProfilePage>[0]["profile"],
) => {
  return render(
    <MemoryRouter>
      <ProfilePage profile={profile} />
    </MemoryRouter>,
  );
};

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when profile is null", () => {
    it("shows a 'Profile not found' message", () => {
      renderProfile(null);
      expect(screen.getByText("Profile not found")).toBeInTheDocument();
    });

    it("renders a 'Back to Home' button", () => {
      renderProfile(null);
      expect(
        screen.getByRole("button", { name: /back to home/i }),
      ).toBeInTheDocument();
    });

    it("navigates to '/' when the Back to Home button is clicked", () => {
      renderProfile(null);
      fireEvent.click(screen.getByRole("button", { name: /back to home/i }));
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  describe("when a valid profile is supplied", () => {
    const profile = {
      id: 42,
      username: "testuser",
      email: "test@example.com",
    };

    it("renders the username prefixed with @", () => {
      renderProfile(profile);
      expect(screen.getByText("@testuser")).toBeInTheDocument();
    });

    it("renders the email address", () => {
      renderProfile(profile);
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    it("renders the user ID", () => {
      renderProfile(profile);
      expect(screen.getByText("#42")).toBeInTheDocument();
    });

    it("renders the default avatar image when no avatar_url is set", () => {
      renderProfile(profile);
      // The default avatar img has alt "Default Profile"
      expect(screen.getByAltText("Default Profile")).toBeInTheDocument();
    });

    it("renders the custom avatar image when avatar_url is set", () => {
      renderProfile({
        ...profile,
        avatar_url: "http://example.com/avatar.jpg",
      });
      const img = screen.getByAltText("Profile");
      expect(img).toHaveAttribute("src", "http://example.com/avatar.jpg");
    });

    it("navigates to '/' when the Back to Home button is clicked", () => {
      renderProfile(profile);
      fireEvent.click(screen.getByRole("button", { name: /back to home/i }));
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});
