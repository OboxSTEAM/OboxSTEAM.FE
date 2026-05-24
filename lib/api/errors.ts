export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.body = body;
  }
}

export class ApiResponseError extends Error {
  readonly code: string | undefined;
  readonly apiError: unknown;

  constructor(message: string, code?: string, apiError?: unknown) {
    super(message);
    this.name = "ApiResponseError";
    this.code = code;
    this.apiError = apiError;
  }
}
