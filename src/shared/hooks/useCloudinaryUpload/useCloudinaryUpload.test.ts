import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useCloudinaryUpload } from "./useCloudinaryUpload";
import { server } from "@/mocks/server";

describe("useCloudinaryUpload", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_CLOUDINARY_CLOUD_NAME", "testcloud");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    server.resetHandlers();
  });

  it("starts with isUploading=false and error=null", () => {
    const { result } = renderHook(() => useCloudinaryUpload());
    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("returns the Cloudinary response data on a successful upload", async () => {
    const { result } = renderHook(() => useCloudinaryUpload());
    const audioFile = new File(["audio"], "song.mp3", { type: "audio/mp3" });

    let data: Awaited<ReturnType<typeof result.current.upload>> | undefined;
    await act(async () => {
      data = await result.current.upload(audioFile);
    });

    expect(data).toEqual({
      secure_url:
        "https://res.cloudinary.com/testcloud/image/upload/v1234567890/mock_upload.jpg",
      duration: 180,
      original_filename: "mock_file",
    });
    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("uses resource_type=video for audio files", async () => {
    let interceptedUrl = "";
    server.use(
      http.post(
        "https://api.cloudinary.com/v1_1/:cloudName/:resourceType/upload",
        ({ request }) => {
          interceptedUrl = request.url;
          return HttpResponse.json({ secure_url: "mock_url" });
        },
      ),
    );

    const { result } = renderHook(() => useCloudinaryUpload());
    const audioFile = new File(["audio"], "song.mp3", { type: "audio/mp3" });

    await act(async () => {
      await result.current.upload(audioFile);
    });

    expect(interceptedUrl).toContain("/video/upload");
  });

  it("uses resource_type=image for image files", async () => {
    let interceptedUrl = "";
    server.use(
      http.post(
        "https://api.cloudinary.com/v1_1/:cloudName/:resourceType/upload",
        ({ request }) => {
          interceptedUrl = request.url;
          return HttpResponse.json({ secure_url: "mock_url" });
        },
      ),
    );

    const { result } = renderHook(() => useCloudinaryUpload());
    const imageFile = new File(["image"], "cover.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.upload(imageFile);
    });

    expect(interceptedUrl).toContain("/image/upload");
  });

  it("sets error state and re-throws when the upload request fails (non-ok)", async () => {
    server.use(
      http.post(
        "https://api.cloudinary.com/v1_1/:cloudName/:resourceType/upload",
        () => {
          return new HttpResponse("Bad Request", { status: 400 });
        },
      ),
    );

    const { result } = renderHook(() => useCloudinaryUpload());
    const file = new File(["data"], "song.mp3", { type: "audio/mp3" });

    await act(async () => {
      await expect(result.current.upload(file)).rejects.toThrow(
        "Cloudinary rejected the signed upload",
      );
    });

    expect(result.current.error).toBe("Cloudinary rejected the signed upload");
    expect(result.current.isUploading).toBe(false);
  });

  it("sets error state and re-throws when fetch itself rejects (network error)", async () => {
    server.use(
      http.post(
        "https://api.cloudinary.com/v1_1/:cloudName/:resourceType/upload",
        () => {
          return HttpResponse.error();
        },
      ),
    );

    const { result } = renderHook(() => useCloudinaryUpload());
    const file = new File(["data"], "song.mp3", { type: "audio/mp3" });

    await act(async () => {
      await expect(result.current.upload(file)).rejects.toThrow();
    });

    expect(result.current.error).toMatch(
      /Failed to fetch|fetch failed|Network error/i,
    );
  });

  it("clears error state when a subsequent upload succeeds", async () => {
    server.use(
      http.post(
        "https://api.cloudinary.com/v1_1/:cloudName/:resourceType/upload",
        () => {
          return new HttpResponse("Error", { status: 500 });
        },
        { once: true },
      ),
    );

    const { result } = renderHook(() => useCloudinaryUpload());
    const file = new File(["data"], "song.mp3", { type: "audio/mp3" });

    await act(async () => {
      await expect(result.current.upload(file)).rejects.toThrow();
    });
    expect(result.current.error).not.toBeNull();

    await act(async () => {
      await result.current.upload(file);
    });
    expect(result.current.error).toBeNull();
  });

  it("posts to the correct Cloudinary URL including the cloud name", async () => {
    let interceptedUrl = "";
    server.use(
      http.post(
        "https://api.cloudinary.com/v1_1/:cloudName/:resourceType/upload",
        ({ request }) => {
          interceptedUrl = request.url;
          return HttpResponse.json({ secure_url: "mock_url" });
        },
      ),
    );

    const { result } = renderHook(() => useCloudinaryUpload());
    const file = new File(["audio"], "song.mp3", { type: "audio/mp3" });

    await act(async () => {
      await result.current.upload(file);
    });

    expect(interceptedUrl).toContain("testcloud");
  });
});
