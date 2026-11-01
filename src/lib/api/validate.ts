import { NextRequest } from "next/server";
import { z, ZodError } from "zod";
import { apiError } from "./response";

export type ValidationSuccess<T> = {
  success: true;
  data: T;
};

export type ValidationFailure = {
  success: false;
  response: ReturnType<typeof apiError>;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

export async function parseAndValidateJson<T>(
  request: NextRequest,
  schema: z.ZodType<T>
): Promise<ValidationResult<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: apiError("Invalid request body. Expected well-formed JSON.", 400, {
        code: "INVALID_JSON",
      }),
    };
  }

  const parseResult = schema.safeParse(body);
  if (!parseResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of (parseResult.error as ZodError).issues) {
      const path = issue.path.join(".");
      if (path && !fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }

    const firstErrorMessage =
      (parseResult.error as ZodError).issues[0]?.message || "Validation failed for request payload.";

    return {
      success: false,
      response: apiError(firstErrorMessage, 400, {
        fieldErrors,
        code: "VALIDATION_FAILED",
      }),
    };
  }

  return {
    success: true,
    data: parseResult.data,
  };
}

export function validateSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodType<T>
): ValidationResult<T> {
  const paramsObj: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    paramsObj[key] = value;
  });

  const parseResult = schema.safeParse(paramsObj);
  if (!parseResult.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of (parseResult.error as ZodError).issues) {
      const path = issue.path.join(".");
      if (path && !fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }

    return {
      success: false,
      response: apiError("Invalid query parameters.", 400, {
        fieldErrors,
        code: "INVALID_QUERY_PARAMS",
      }),
    };
  }

  return {
    success: true,
    data: parseResult.data,
  };
}

