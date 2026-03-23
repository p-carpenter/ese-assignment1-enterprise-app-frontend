import { describe, it, expect, beforeEach } from "vitest";
import {
  login,
  logout,
  getMe,
  register,
  requestPasswordReset,
  confirmPasswordReset,
} from "./index";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";
import { resetHandlerState } from "@/mocks/handlers";

describe("Auth API", () => {
  beforeEach(() => {
    resetHandlerState();
  });

  describe("login", () => {
    it("logs in successfully and does not throw", async () => {
      await expect(
        login("user@example.com", "secret"),
      ).resolves.toBeUndefined();
    });

    it("propagates errors from the request", async () => {
      server.use(
        http.post("http://localhost:8000/api/auth/login/", () =>
          HttpResponse.json({ detail: "Invalid credentials" }, { status: 400 }),
        ),
      );

      await expect(login("user@example.com", "wrong")).rejects.toThrow();
    });
  });

  describe("logout", () => {
    it("logs out successfully without throwing", async () => {
      await expect(logout()).resolves.toBeUndefined();
    });
  });

  describe("getMe", () => {
    it("returns the user profile when authenticated", async () => {
      const result = await getMe();
      expect(result.username).toBe("testuser");
    });

    it("propagates errors when the session has expired", async () => {
      server.use(
        http.get(
          "http://localhost:8000/api/auth/user/",
          () => new HttpResponse(null, { status: 401 }),
        ),
      );

      await expect(getMe()).rejects.toThrow();
    });
  });

  describe("register", () => {
    it("registers successfully without throwing", async () => {
      await expect(
        register("newuser", "new@example.com", "pass1234", "pass1234"),
      ).resolves.toBeUndefined();
    });

    it("propagates errors on registration failure", async () => {
      server.use(
        http.post("http://localhost:8000/api/auth/registration/", () =>
          HttpResponse.json(
            { email: ["Email already taken"] },
            { status: 400 },
          ),
        ),
      );

      await expect(
        register("testuser", "taken@example.com", "pass", "pass"),
      ).rejects.toThrow();
    });
  });

  describe("requestPasswordReset", () => {
    it("completes successfully", async () => {
      await expect(
        requestPasswordReset("user@example.com"),
      ).resolves.toBeUndefined();
    });
  });

  describe("confirmPasswordReset", () => {
    it("completes successfully with all required fields", async () => {
      await expect(
        confirmPasswordReset("uid123", "token456", "newpass1", "newpass1"),
      ).resolves.toBeUndefined();
    });

    it("handles undefined uid and token gracefully, allowing the server to reject it", async () => {
      server.use(
        http.post(
          "http://localhost:8000/api/auth/password/reset/confirm/",
          () => HttpResponse.json({ detail: "Invalid token" }, { status: 400 }),
        ),
      );

      await expect(
        confirmPasswordReset(undefined, undefined, "newpass", "newpass"),
      ).rejects.toThrow();
    });
  });
});
