import { ApiError } from "@/shared/api/errors";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const request = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const url = `${API_URL}${endpoint}`;

  const config = {
    ...options,
    credentials: "include" as RequestCredentials,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return undefined as T;
  }

  // Handle 401 Unauthorised (Session expired)
  if (response.status === 401) {
    console.warn("Unauthorised request - user may need to log in again.");
  }

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ detail: "Unknown error" }));

    throw new ApiError(response.status, errorData);
  }

  return response.json();
};
