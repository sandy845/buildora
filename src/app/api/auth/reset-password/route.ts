import { NextRequest } from "next/server";
import { resetPassword } from "@/lib/auth/server";
import {
  authPasswordResetLimiter,
  getClientIp,
  getRateLimitHeaders,
} from "@/lib/rate-limit";
import {
  apiError,
  apiInternalError,
  apiSuccess,
  apiTooManyRequests,
  parseAndValidateJson,
  ResetPasswordRequestSchema,
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

    const validation = await parseAndValidateJson(request, ResetPasswordRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { token, password } = validation.data;
    const success = await resetPassword(token, password);
    if (!success) {
      return apiError("Invalid or expired password reset token.", 400, { headers: rateHeaders });
    }

    return apiSuccess({ message: "Password has been successfully updated." }, 200, rateHeaders);
  } catch (error) {
    return apiInternalError(error, "Unable to reset password.");
  }
}
