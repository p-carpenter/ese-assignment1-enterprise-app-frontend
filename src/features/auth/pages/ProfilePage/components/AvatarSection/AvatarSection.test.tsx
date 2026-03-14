import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AvatarSection } from "./AvatarSection";
import { MemoryRouter } from "react-router-dom";

const renderSection = (
  props: Partial<React.ComponentProps<typeof AvatarSection>> = {},
) => {
  const defaultProps: React.ComponentProps<typeof AvatarSection> = {
    username: "testuser",
    avatarUrl: "http://example.com/avatar.jpg",
    isEditing: false,
    isUploading: false,
    onAvatarChange: vi.fn(),
  };
  return render(
    <MemoryRouter>
      <AvatarSection {...defaultProps} {...props} />
    </MemoryRouter>,
  );
};

describe("AvatarSection", () => {
  describe("avatar display", () => {
    it("renders the provided avatar URL", () => {
      renderSection();
      expect(screen.getByAltText("Profile")).toHaveAttribute(
        "src",
        "http://example.com/avatar.jpg",
      );
    });

    it("falls back to default avatar when URL is empty", () => {
      renderSection({ avatarUrl: "" });
      expect(screen.getByAltText("Profile")).toHaveAttribute(
        "src",
        expect.stringContaining("default_avatar.png"),
      );
    });

    it("renders the username", () => {
      renderSection();
      expect(screen.getByText("testuser")).toBeInTheDocument();
    });
  });

  describe("view mode", () => {
    it("shows Edit Profile link", () => {
      renderSection();
      expect(
        screen.getByRole("link", { name: /edit profile/i }),
      ).toBeInTheDocument();
    });

    it("does not show file input", () => {
      renderSection();
      expect(document.querySelector('input[type="file"]')).toBeNull();
    });

    it("does not show uploading text when not uploading", () => {
      renderSection();
      expect(screen.queryByText("Uploading avatar...")).not.toBeInTheDocument();
    });
  });

  describe("edit mode", () => {
    it("hides Edit Profile link", () => {
      renderSection({ isEditing: true });
      expect(
        screen.queryByRole("link", { name: /edit profile/i }),
      ).not.toBeInTheDocument();
    });

    it("shows hidden file input", () => {
      renderSection({ isEditing: true });
      const input = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.style.display).toBe("none");
    });

    it("calls onAvatarChange with the selected file", async () => {
      const user = userEvent.setup();
      const onAvatarChange = vi.fn();
      renderSection({ isEditing: true, onAvatarChange });

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const file = new File(["content"], "avatar.png", { type: "image/png" });
      await user.upload(fileInput, file);

      expect(onAvatarChange).toHaveBeenCalledWith(file);
    });

    it("does not call onAvatarChange if no file is selected", async () => {
      const onAvatarChange = vi.fn();
      renderSection({ isEditing: true, onAvatarChange });

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      // Simulate change event with no files
      const { fireEvent } = await import("@testing-library/react");
      fireEvent.change(fileInput, { target: { files: null } });

      expect(onAvatarChange).not.toHaveBeenCalled();
    });

    it("triggers file input when edit overlay is clicked", async () => {
      const user = userEvent.setup();
      const onAvatarChange = vi.fn();
      renderSection({ isEditing: true, onAvatarChange });

      const overlay = screen.queryByTestId("edit-overlay");
      expect(overlay).not.toBeNull();

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      new File(["content"], "via-overlay.png", { type: "image/png" });

      // Spy on the click to confirm the overlay delegates to the input.
      const clickSpy = vi.spyOn(fileInput, "click");
      await user.click(overlay!);
      expect(clickSpy).toHaveBeenCalled();
    });

    it("triggers file input when edit badge is clicked", async () => {
      const user = userEvent.setup();
      renderSection({ isEditing: true });

      const badge = screen.queryByTestId("edit-badge");
      expect(badge).not.toBeNull();

      const fileInput = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, "click");
      await user.click(badge!);
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe("upload state", () => {
    it("shows uploading text when isUploading is true", () => {
      renderSection({ isUploading: true });
      expect(screen.getByText("Uploading avatar...")).toBeInTheDocument();
    });
  });
});
