import { NextRequest } from "next/server";
import { requestPasswordReset } from "@/lib/auth/server";
import {
  authPasswordResetLimiter,
  getClientIp,
  getRateLimitHeaders,
} from "@/lib/rate-limit";
import {
  apiInternalError,
  apiSuccess,
  apiTooManyRequests,
  ForgotPasswordRequestSchema,
  parseAndValidateJson,
} from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rateCheck = await authPasswordResetLimiter.checkAsync(ip);
    const rateHeaders = getRateLimitHeaders(rateCheck, authPasswordResetLimiter.limit);

    if (!rateCheck.success) {
      const retrySeconds = Math.ceil(rateCheck.retryAfterMs / 1000);
      return apiTooManyRequests(
        `Too many password reset attempts. Please try again in ${retrySeconds} seconds.`,
        rateHeaders
      );
    }

    const validation = await parseAndValidateJson(request, ForgotPasswordRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    await requestPasswordReset(validation.data.email);
    // Generic response to prevent email enumeration
    return apiSuccess(
      {
        message: "If an account with that email exists, password reset instructions have been sent.",
      },
      200,
      rateHeaders
    );
  } catch (error) {
    return apiInternalError(error, "Unable to process password reset request.");
  }
}
