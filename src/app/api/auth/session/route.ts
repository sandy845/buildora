import { NextRequest } from "next/server";
import { createFirebaseSession } from "@/lib/auth/server";
import {
  apiInternalError,
  apiSuccess,
  apiUnauthorized,
  parseAndValidateJson,
  SessionExchangeRequestSchema,
} from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const validation = await parseAndValidateJson(request, SessionExchangeRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { idToken, name, email } = validation.data;
    const result = await createFirebaseSession(idToken, { name, email });

    if (!result.success) {
      return apiUnauthorized(result.error || "Authentication failed. Invalid or expired token.");
    }

    return apiSuccess({
      role: result.role,
      user: result.user,
    });
  } catch (err: unknown) {
    return apiInternalError(err, "Failed to establish authenticated session.");
  }
}
