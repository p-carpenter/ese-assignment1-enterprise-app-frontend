import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { UploadPage } from "./UploadPage";
import "@testing-library/jest-dom/vitest";
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

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
    <div data-testid="song-upload-form">Mock Upload Form</div>
  ),
}));

vi.mock(
  "@/features/songs/components/JamendoSongSearch/JamendoSongSearch",
  () => ({
    JamendoSongSearch: ({
      onImportSuccess,
    }: {
      onImportSuccess: () => void;
    }) => (
      <div data-testid="jamendo-song-search">
        Mock Jamendo Search
        <button data-testid="mock-success-trigger" onClick={onImportSuccess}>
          Simulate Success
        </button>
      </div>
    ),
  }),
);

describe("UploadPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

  describe("Tab Navigation & Rendering", () => {
    it("shows upload tab content by default", () => {
      renderComponent();

      const uploadTab = screen.getByRole("tab", { name: /upload mp3/i });
      expect(uploadTab).toHaveAttribute("aria-selected", "true");
      expect(screen.getByTestId("song-upload-form")).toBeInTheDocument();
      expect(
        screen.queryByTestId("jamendo-song-search"),
      ).not.toBeInTheDocument();
    });

    it("switches to Jamendo tab content when clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      const jamendoTab = screen.getByRole("tab", { name: /search jamendo/i });
      await user.click(jamendoTab);

      expect(jamendoTab).toHaveAttribute("aria-selected", "true");
      expect(screen.getByTestId("jamendo-song-search")).toBeInTheDocument();
      expect(screen.queryByTestId("song-upload-form")).not.toBeInTheDocument();
    });

    it("switches back to upload tab correctly", async () => {
      const user = userEvent.setup();
      renderComponent();

      await user.click(screen.getByRole("tab", { name: /search jamendo/i }));
      expect(screen.getByTestId("jamendo-song-search")).toBeInTheDocument();

      await user.click(screen.getByRole("tab", { name: /upload mp3/i }));
      expect(screen.getByTestId("song-upload-form")).toBeInTheDocument();
      expect(
        screen.queryByTestId("jamendo-song-search"),
      ).not.toBeInTheDocument();
    });

    it("should have no accessibility violations", async () => {
      const { container } = renderComponent();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Navigation Actions", () => {
    it("navigates to '/' when Go Home is clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      const goHomeButton = screen.getByRole("button", { name: /go home/i });
      await user.click(goHomeButton);

      expect(mockNavigate).toHaveBeenCalledWith("/");
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
  });
});
