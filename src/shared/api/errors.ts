export interface DjangoErrorPayload {
  detail?: string;
  non_field_errors?: string[];
  [field: string]: string | string[] | undefined;
}

export class ApiError extends Error {
  public status: number;
  public data: DjangoErrorPayload;

  constructor(status: number, data: DjangoErrorPayload, message?: string) {
    super(message || "API Error");
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }

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
