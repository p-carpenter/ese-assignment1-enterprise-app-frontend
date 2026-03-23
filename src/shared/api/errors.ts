/**
 * Shape of error payloads returned by Django REST framework endpoints.
 */
export interface DjangoErrorPayload {
  detail?: string;
  non_field_errors?: string[];
  [field: string]: string | string[] | undefined;
}

/**
 * Error wrapper for API responses with structured error payloads.
 */
export class ApiError extends Error {
  public status: number;
  public data: DjangoErrorPayload;

  /**
   * Create a new ApiError.
   * @param status HTTP status code.
   * @param data Error payload from the server.
   * @param message Optional error message.
   */
  constructor(status: number, data: DjangoErrorPayload, message?: string) {
    super(message || "API Error");
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

  /**
   * Produce a human readable message from the server payload.
   * @param fallback Fallback string if no message was extracted.
   * @returns Combined error message.
   */
  getReadableMessage(fallback = "An error occurred."): string {
    const messages: string[] = [];

    if (Array.isArray(this.data.non_field_errors)) {
      messages.push(...this.data.non_field_errors);
    }

    if (typeof this.data.detail === "string") {
      messages.push(this.data.detail);
    }

    for (const [field, value] of Object.entries(this.data)) {
      if (field === "non_field_errors" || field === "detail") continue;
      if (Array.isArray(value)) {
        const label = field.replace(/_/g, " ");
        messages.push(`${label}: ${value.join(", ")}`);
      }
    }

    return messages.length > 0 ? messages.join(" ") : fallback;
  }
}
