import { NextResponse } from "next/server";

export type ApiResponseMeta = {
  timestamp: string;
  requestId?: string;
  [key: string]: unknown;
};

export type ApiSuccessPayload<T = unknown> = {
  success: true;
  data?: T;
  meta?: ApiResponseMeta;
  [key: string]: unknown;
};

export type ApiErrorPayload = {
  success: false;
  error: string;
  fieldErrors?: Record<string, string>;
  code?: string;
  meta?: ApiResponseMeta;
};

export function apiSuccess<T extends Record<string, unknown>>(
  data: T,
  status = 200,
  headers?: HeadersInit
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...data,
      meta: { timestamp: new Date().toISOString() },
    },
    { status, headers }
  );
}

export function apiError(
  message: string,
  status = 400,
  options?: {
    fieldErrors?: Record<string, string>;
    code?: string;
    headers?: HeadersInit;
  }
): NextResponse<ApiErrorPayload> {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(options?.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
      ...(options?.code ? { code: options.code } : {}),
      meta: { timestamp: new Date().toISOString() },
    },
    { status, headers: options?.headers }
  );
}

export function apiUnauthorized(
  message = "Unauthorized. Please log in to proceed."
): NextResponse<ApiErrorPayload> {
  return apiError(message, 401, { code: "UNAUTHORIZED" });
}

export function apiForbidden(
  message = "Forbidden. You do not have permission to perform this action."
): NextResponse<ApiErrorPayload> {
  return apiError(message, 403, { code: "FORBIDDEN" });
}

export function apiNotFound(
  message = "Requested resource was not found."
): NextResponse<ApiErrorPayload> {
  return apiError(message, 404, { code: "NOT_FOUND" });
}

export function apiMethodNotAllowed(
  allowedMethods: string[]
): NextResponse<ApiErrorPayload> {
  return apiError(
    `Method not allowed. Permitted methods: ${allowedMethods.join(", ")}`,
    405,
    {
      code: "METHOD_NOT_ALLOWED",
      headers: { Allow: allowedMethods.join(", ") },
    }
  );
}

export function apiTooManyRequests(
  message: string,
  headers?: HeadersInit
): NextResponse<ApiErrorPayload> {
  return apiError(message, 429, { code: "TOO_MANY_REQUESTS", headers });
}

export function apiInternalError(
  error?: unknown,
  customMessage = "An unexpected error occurred while processing your request."
): NextResponse<ApiErrorPayload> {
  if (process.env.NODE_ENV !== "production" && error) {
    console.error("[api-internal-error]", error);
  }
  return apiError(customMessage, 500, { code: "INTERNAL_SERVER_ERROR" });
}

