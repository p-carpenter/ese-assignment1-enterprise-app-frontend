import { request } from "@/shared/api/client";
import { useState } from "react";

interface CloudinaryResponse {
  secure_url: string;
  duration?: number; // Only present for audio/video
  original_filename: string;
}

interface SignatureResponse {
  signature: string;
  timestamp: number;
  api_key: string;
}

/**
 * Hook providing a convenience signed `upload` function for Cloudinary uploads.
 * Manages `isUploading` and `error` state and returns the Cloudinary response on success.
 * @returns An object with `upload(file)`, `isUploading` and `error`.
 */
export const useCloudinaryUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File | null) => {
    if (!file) {
      return null;
    }

    setIsUploading(true);
    setError(null);

    const cloudName: string = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

    const resourceType: string = file.type.startsWith("audio")
      ? "video"
      : "image";
    try {
      const sigData = await request<SignatureResponse>(
        "/cloudinary/generate-signature/",
        {
          method: "GET",
        },
      );

      const { signature, timestamp, api_key } = sigData;

      const formData: FormData = new FormData();
      formData.append("file", file);
      formData.append("api_key", api_key);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", "prod");

      const uploadResponse: Response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        { method: "POST", body: formData },
      );

      if (!uploadResponse.ok)
        throw new Error("Cloudinary rejected the signed upload");

      const data: CloudinaryResponse = await uploadResponse.json();
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown upload error");
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading, error };
};

export type useCloudinaryUploadType = ReturnType<typeof useCloudinaryUpload>;
