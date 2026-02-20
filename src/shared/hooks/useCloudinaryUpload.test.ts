import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCloudinaryUpload } from "./useCloudinaryUpload";

describe("useCloudinaryUpload", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubEnv("VITE_CLOUDINARY_CLOUD_NAME", "testcloud");
    vi.stubEnv("VITE_CLOUDINARY_PRESET", "testpreset");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("starts with isUploading=false and error=null", () => {
    const { result } = renderHook(() => useCloudinaryUpload());
    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("returns the Cloudinary response data on a successful upload", async () => {
    const mockData = {
      secure_url: "https://res.cloudinary.com/testcloud/audio.mp3",
      duration: 180,
      original_filename: "my_song",
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), { status: 200 }),
    );

    const { result } = renderHook(() => useCloudinaryUpload());
    const audioFile = new File(["audio"], "song.mp3", { type: "audio/mp3" });

    let data: Awaited<ReturnType<typeof result.current.upload>> | undefined;
    await act(async () => {
      data = await result.current.upload(audioFile);
    });

    expect(data).toEqual(mockData);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("uses resource_type=video for audio files", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ secure_url: "url", original_filename: "song" }),
        { status: 200 },
      ),
    );

    const { result } = renderHook(() => useCloudinaryUpload());
    const audioFile = new File(["audio"], "song.mp3", { type: "audio/mp3" });

    await act(async () => {
      await result.current.upload(audioFile);
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/video/upload"),
      expect.any(Object),
    );
  });

  it("uses resource_type=image for image files", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ secure_url: "url", original_filename: "cover" }),
        { status: 200 },
      ),
    );

    const { result } = renderHook(() => useCloudinaryUpload());
    const imageFile = new File(["image"], "cover.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.upload(imageFile);
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/image/upload"),
      expect.any(Object),
    );
  });

  it("sets error state and re-throws when the upload request fails (non-ok)", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Bad Request", { status: 400 }),
    );

    const { result } = renderHook(() => useCloudinaryUpload());
    const file = new File(["data"], "song.mp3", { type: "audio/mp3" });

    await act(async () => {
      await expect(result.current.upload(file)).rejects.toThrow("Upload failed");
    });

    expect(result.current.error).toBe("Upload failed");
    expect(result.current.isUploading).toBe(false);
  });

  it("sets error state and re-throws when fetch itself rejects (network error)", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network failure"));

    const { result } = renderHook(() => useCloudinaryUpload());
    const file = new File(["data"], "song.mp3", { type: "audio/mp3" });

    await act(async () => {
      await expect(result.current.upload(file)).rejects.toThrow(
        "Network failure",
      );
    });

    expect(result.current.error).toBe("Network failure");
  });

  it("clears error state when a subsequent upload succeeds", async () => {
    // First call fails
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Error", { status: 500 }),
    );
    // Second call succeeds
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ secure_url: "url", original_filename: "song" }),
        { status: 200 },
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
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ secure_url: "url", original_filename: "song" }),
        { status: 200 },
      ),
    );

    const { result } = renderHook(() => useCloudinaryUpload());
    const file = new File(["audio"], "song.mp3", { type: "audio/mp3" });

    await act(async () => {
      await result.current.upload(file);
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("testcloud"),
      expect.any(Object),
    );
  });

  it("sends a FormData body with the file, upload_preset, and resource_type", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ secure_url: "url", original_filename: "song" }),
        { status: 200 },
      ),
    );

    const { result } = renderHook(() => useCloudinaryUpload());
    const file = new File(["audio"], "song.mp3", { type: "audio/mp3" });

    await act(async () => {
      await result.current.upload(file);
    });

    const [, fetchOptions] = vi.mocked(fetch).mock.calls[0];
    expect((fetchOptions as RequestInit).method).toBe("POST");
    const body = (fetchOptions as RequestInit).body as FormData;
    expect(body.get("file")).toBe(file);
    expect(body.get("upload_preset")).toBe("testpreset");
    expect(body.get("resource_type")).toBe("video"); // audio → "video"
  });
});
