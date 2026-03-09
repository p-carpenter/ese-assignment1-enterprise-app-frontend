import { describe, it, expect } from "vitest";
import { ApiError } from "./errors";

describe("ApiError", () => {
  it("extends Error", () => {
    const error = new ApiError(400, { detail: "Bad request" });
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
  });

  it("stores status and data", () => {
    const data = { detail: "Not found" };
    const error = new ApiError(404, data);
    expect(error.status).toBe(404);
    expect(error.data).toEqual(data);
  });

  it("sets name to ApiError", () => {
    const error = new ApiError(500, {});
    expect(error.name).toBe("ApiError");
  });

  it("uses the provided message or defaults to 'API Error'", () => {
    const withMsg = new ApiError(400, {}, "Custom message");
    expect(withMsg.message).toBe("Custom message");

    const withoutMsg = new ApiError(400, {});
    expect(withoutMsg.message).toBe("API Error");
  });

  // ── getReadableMessage ──────────────────────────────────────────────────

  describe("getReadableMessage", () => {
    it("returns detail when present", () => {
      const error = new ApiError(400, { detail: "Invalid credentials" });
      expect(error.getReadableMessage()).toBe("Invalid credentials");
    });

    it("returns non_field_errors joined", () => {
      const error = new ApiError(400, {
        non_field_errors: ["Error 1", "Error 2"],
      });
      expect(error.getReadableMessage()).toBe("Error 1 Error 2");
    });

    it("returns field-level errors with field name", () => {
      const error = new ApiError(400, {
        email: ["This field is required."],
      });
      expect(error.getReadableMessage()).toBe("email: This field is required.");
    });

    it("converts underscored field names to spaces", () => {
      const error = new ApiError(400, {
        first_name: ["Too short."],
      });
      expect(error.getReadableMessage()).toContain("first name: Too short.");
    });

    it("combines multiple error sources", () => {
      const error = new ApiError(400, {
        detail: "General error",
        non_field_errors: ["NFE"],
        email: ["Invalid email"],
      });
      const msg = error.getReadableMessage();
      expect(msg).toContain("NFE");
      expect(msg).toContain("General error");
      expect(msg).toContain("email: Invalid email");
    });

    it("returns the fallback when no error data is present", () => {
      const error = new ApiError(500, {});
      expect(error.getReadableMessage()).toBe("An error occurred.");
    });

    it("uses a custom fallback message", () => {
      const error = new ApiError(500, {});
      expect(error.getReadableMessage("Something broke")).toBe(
        "Something broke",
      );
    });

    it("ignores non-array field values", () => {
      const error = new ApiError(400, {
        detail: undefined,
        non_field_errors: undefined,
      });
      expect(error.getReadableMessage("fallback")).toBe("fallback");
    });
  });
});
