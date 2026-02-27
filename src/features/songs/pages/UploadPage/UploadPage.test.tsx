import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UploadPage } from "./UploadPage";
import "@testing-library/jest-dom/vitest";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/features/songs", () => ({
  SongUploadForm: () => (
    <div data-testid="song-upload-form">Song Upload Form</div>
  ),
}));

vi.mock("@/shared/layout", () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

describe("UploadPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Header", () => {
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  it("renders the SongUploadForm", () => {
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("song-upload-form")).toBeInTheDocument();
  });

  it("renders a 'Cancel Upload' button", () => {
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("button", { name: /cancel upload/i }),
    ).toBeInTheDocument();
  });

  it("navigates to '/' when Cancel Upload is clicked", () => {
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /cancel upload/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
