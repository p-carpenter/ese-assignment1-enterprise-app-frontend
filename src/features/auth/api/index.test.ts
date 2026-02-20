import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  login,
  logout,
  getMe,
  register,
  requestPasswordReset,
  confirmPasswordReset,
} from "./index";

vi.mock("@/shared/api/client", () => ({
  request: vi.fn(),
}));

import { request } from "@/shared/api/client";
const mockRequest = vi.mocked(request);

describe("Auth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("POSTs to /auth/login/ with email and password", async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await login("user@example.com", "secret");

      expect(mockRequest).toHaveBeenCalledWith("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email: "user@example.com", password: "secret" }),
      });
    });

    it("propagates errors from the request", async () => {
      mockRequest.mockRejectedValueOnce(new Error("Invalid credentials"));

      await expect(login("user@example.com", "wrong")).rejects.toThrow(
        "Invalid credentials",
      );
    });
  });

  describe("logout", () => {
    it("POSTs to /auth/logout/", async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await logout();

      expect(mockRequest).toHaveBeenCalledWith("/auth/logout/", {
        method: "POST",
      });
    });
  });

  describe("getMe", () => {
    it("GETs /auth/user/ and returns the user profile", async () => {
      const mockUser = {
        id: 1,
        username: "testuser",
        email: "user@example.com",
      };
      mockRequest.mockResolvedValueOnce(mockUser);

      const result = await getMe();

      expect(mockRequest).toHaveBeenCalledWith("/auth/user/");
      expect(result).toEqual(mockUser);
    });

    it("propagates errors when the session has expired", async () => {
      mockRequest.mockRejectedValueOnce(new Error("Unauthorised"));

      await expect(getMe()).rejects.toThrow("Unauthorised");
    });
  });

  describe("register", () => {
    it("POSTs to /auth/register/ with all four fields", async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await register("testuser", "user@example.com", "pass1234", "pass1234");

      expect(mockRequest).toHaveBeenCalledWith("/auth/register/", {
        method: "POST",
        body: JSON.stringify({
          username: "testuser",
          email: "user@example.com",
          password1: "pass1234",
          password2: "pass1234",
        }),
      });
    });

    it("propagates errors on registration failure", async () => {
      mockRequest.mockRejectedValueOnce(new Error("Email already taken"));

      await expect(
        register("testuser", "taken@example.com", "pass", "pass"),
      ).rejects.toThrow("Email already taken");
    });
  });

  describe("requestPasswordReset", () => {
    it("POSTs to /auth/password/reset/ with the email", async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await requestPasswordReset("user@example.com");

      expect(mockRequest).toHaveBeenCalledWith("/auth/password/reset/", {
        method: "POST",
        body: JSON.stringify({ email: "user@example.com" }),
      });
    });
  });

  describe("confirmPasswordReset", () => {
    it("POSTs to /auth/password/reset/confirm/ with all required fields", async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await confirmPasswordReset(
        "uid123",
        "token456",
        "newpass1",
        "newpass1",
      );

      expect(mockRequest).toHaveBeenCalledWith(
        "/auth/password/reset/confirm/",
        {
          method: "POST",
          body: JSON.stringify({
            uid: "uid123",
            token: "token456",
            new_password1: "newpass1",
            new_password2: "newpass1",
          }),
        },
      );
    });

    it("handles undefined uid and token gracefully", async () => {
      mockRequest.mockResolvedValueOnce(undefined);

      await confirmPasswordReset(undefined, undefined, "newpass", "newpass");

      expect(mockRequest).toHaveBeenCalledWith(
        "/auth/password/reset/confirm/",
        expect.objectContaining({
          body: JSON.stringify({
            uid: undefined,
            token: undefined,
            new_password1: "newpass",
            new_password2: "newpass",
          }),
        }),
      );
    });
  });
});
