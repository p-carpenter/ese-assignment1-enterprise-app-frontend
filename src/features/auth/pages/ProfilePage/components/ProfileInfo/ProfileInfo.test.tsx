import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileInfo } from "./ProfileInfo";

let capturedFormProps: { onSuccess: () => void; onCancel: () => void } | null =
  null;

vi.mock("../ChangePasswordForm/ChangePasswordForm", () => ({
  ChangePasswordForm: (props: {
    onSuccess: () => void;
    onCancel: () => void;
  }) => {
    capturedFormProps = props;
    return (
      <div data-testid="mock-change-password-form">
        <button onClick={props.onCancel}>Cancel Mock</button>
      </div>
    );
  },
}));

describe("ProfileInfo", () => {
  const defaultProps = {
    id: 42,
    username: "testuser",
    email: "test@example.com",
    isEditing: false,
    onUsernameChange: vi.fn(),
    onPasswordChangeSuccess: vi.fn(),
  };

  beforeEach(() => {
    capturedFormProps = null;
    vi.clearAllMocks();
  });

  describe("view mode", () => {
    it("renders user id, username and email as static text", () => {
      render(<ProfileInfo {...defaultProps} />);
      expect(screen.getByText("#42")).toBeInTheDocument();
      expect(screen.getByText("testuser")).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    it("does not render a text input", () => {
      render(<ProfileInfo {...defaultProps} />);
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("does not show password edit icon", () => {
      render(<ProfileInfo {...defaultProps} />);
      expect(screen.queryByTestId("edit-password-icon")).toBeNull();
    });

    it("shows masked password placeholder", () => {
      render(<ProfileInfo {...defaultProps} />);
      expect(screen.getByText("********")).toBeInTheDocument();
    });
  });

  describe("edit mode", () => {
    describe("username input", () => {
      it("renders an input pre-filled with the current username", () => {
        render(<ProfileInfo {...defaultProps} isEditing={true} />);
        expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
      });

      it("calls onUsernameChange as the user types", async () => {
        const onUsernameChange = vi.fn();
        render(
          <ProfileInfo
            {...defaultProps}
            isEditing={true}
            onUsernameChange={onUsernameChange}
          />,
        );

        const input = screen.getByDisplayValue("testuser");
        fireEvent.change(input, { target: { value: "newusername" } });

        expect(onUsernameChange).toHaveBeenCalledWith("newusername");
      });

      it("calls onUsernameChange with empty string when cleared", async () => {
        const user = userEvent.setup();
        const onUsernameChange = vi.fn();
        render(
          <ProfileInfo
            {...defaultProps}
            isEditing={true}
            onUsernameChange={onUsernameChange}
          />,
        );

        await user.clear(screen.getByDisplayValue("testuser"));
        expect(onUsernameChange).toHaveBeenCalledWith("");
      });
    });

    describe("password change", () => {
      it("shows the password edit icon", () => {
        render(<ProfileInfo {...defaultProps} isEditing={true} />);
        expect(screen.queryByTestId("edit-password-icon")).not.toBeNull();
      });

      it("opens the password change form when the icon is clicked", async () => {
        const user = userEvent.setup();
        render(<ProfileInfo {...defaultProps} isEditing={true} />);

        await user.click(screen.getByTestId("edit-password-icon"));
        expect(
          screen.getByTestId("mock-change-password-form"),
        ).toBeInTheDocument();
      });

      it("closes the form when cancel is clicked", async () => {
        const user = userEvent.setup();
        render(<ProfileInfo {...defaultProps} isEditing={true} />);

        await user.click(screen.getByTestId("edit-password-icon"));
        await user.click(screen.getByText("Cancel Mock"));

        expect(
          screen.queryByTestId("mock-change-password-form"),
        ).not.toBeInTheDocument();
      });

      it("calls onPasswordChangeSuccess and closes the form on success", async () => {
        const user = userEvent.setup();
        const onPasswordChangeSuccess = vi.fn();
        render(
          <ProfileInfo
            {...defaultProps}
            isEditing={true}
            onPasswordChangeSuccess={onPasswordChangeSuccess}
          />,
        );

        await user.click(screen.getByTestId("edit-password-icon"));
        expect(
          screen.getByTestId("mock-change-password-form"),
        ).toBeInTheDocument();

        act(() => {
          capturedFormProps?.onSuccess();
        });

        expect(onPasswordChangeSuccess).toHaveBeenCalled();
        expect(
          screen.queryByTestId("mock-change-password-form"),
        ).not.toBeInTheDocument();
      });
    });
  });
});
