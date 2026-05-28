export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function jsonResponse<T>(body: T, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("cache-control", headers.get("cache-control") ?? "no-store");

  return Response.json(body, {
    ...init,
    headers
  });
}

export function errorResponse(error: ApiError): Response {
  const body: ApiErrorBody = {
    error: {
      code: error.code,
      message: error.message,
      details: error.details
    }
  };

  return jsonResponse(body, { status: error.status });
}

export function notFound(message = "Not found"): Response {
  return errorResponse(new ApiError(404, "not_found", message));
}

export function methodNotAllowed(method: string): Response {
  return errorResponse(new ApiError(405, "method_not_allowed", `${method} is not supported for this route.`));
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
  }
}
