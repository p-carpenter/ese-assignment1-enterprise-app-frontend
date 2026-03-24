import { ApiError } from "@/shared/api/errors";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

/** Helper function to get CSRF token from cookies for Django requests.*/
const getCsrfToken = () => {
  const match = document.cookie.match(new RegExp("(^| )csrftoken=([^;]+)"));
  return match ? match[2] : null;
};

/**
 * Generic API request helper that wraps fetch and throws `ApiError` on failure.
 * It automatically prefixes the API base URL and sets JSON headers.
 * @template T Expected response type.
 * @param endpoint API endpoint path (leading slash recommended).
 * @param options Fetch options to merge with defaults.
 * @returns Parsed JSON response of type `T` or `undefined` for empty responses.
 */
export const request = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const url = `${API_URL}${endpoint}`;

  // Extract the CSRF token.
  const csrfToken = getCsrfToken();

  const config = {
    ...options,
    credentials: "include" as RequestCredentials,
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
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
