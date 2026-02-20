import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { request } from "./client";

describe("API client – request()", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("makes a request and returns parsed JSON on success", async () => {
    const mockData = { id: 1, name: "Test" };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), { status: 200 }),
    );

    const result = await request<typeof mockData>("/test/");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/test/"),
      expect.objectContaining({ credentials: "include" }),
    );
    expect(result).toEqual(mockData);
  });

  it("includes credentials: include on every request", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await request("/test/");

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("sets Content-Type to application/json by default", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await request("/test/");

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("merges custom headers with the default Content-Type header", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 200 }));

    await request("/test/", { headers: { Authorization: "Bearer token" } });

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        }),
      }),
    );
  });

  it("passes method and body through to fetch", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const body = JSON.stringify({ name: "Test" });
    await request("/test/", { method: "POST", body });

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: "POST", body }),
    );
  });

  it("returns undefined for a 204 No Content response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await request<void>("/test/");

    expect(result).toBeUndefined();
  });

  it("returns undefined when content-length header is '0'", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("", {
        status: 200,
        headers: { "content-length": "0" },
      }),
    );

    const result = await request<void>("/test/");

    expect(result).toBeUndefined();
  });

  it("logs a console.warn on a 401 Unauthorised response and then throws", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Unauthorized" }), {
        status: 401,
      }),
    );

    await expect(request("/test/")).rejects.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unauthorised"),
    );

    warnSpy.mockRestore();
  });

  it("throws an error for a non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Not found" }), { status: 404 }),
    );

    await expect(request("/test/")).rejects.toThrow();

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Bad request" }), { status: 400 }),
    );

    await expect(request("/test/")).rejects.toThrow();

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Server error" }), { status: 500 }),
    );

    await expect(request("/test/")).rejects.toThrow();
  });

  it("throws with 'Unknown error' detail when error body is not JSON", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Not JSON", { status: 500 }),
    );

    await expect(request("/test/")).rejects.toThrow();
  });

  it("propagates network errors (fetch rejects)", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    await expect(request("/test/")).rejects.toThrow("Network error");
  });
});
