import { NextRequest } from "next/server";
import { verifyEmailToken } from "@/lib/auth/server";
import { authVerificationAttemptLimiter, getClientIp, getRateLimitHeaders } from "@/lib/rate-limit";
import {
  apiError,
  apiInternalError,
  apiSuccess,
  apiTooManyRequests,
  parseAndValidateJson,
  VerifyOtpRequestSchema,
} from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const rateCheck = await authVerificationAttemptLimiter.checkAsync(getClientIp(request.headers));
    if (!rateCheck.success) {
      return apiTooManyRequests(
        "Too many verification attempts. Please try again later.",
        getRateLimitHeaders(rateCheck, authVerificationAttemptLimiter.limit)
      );
    }

    const validation = await parseAndValidateJson(request, VerifyOtpRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const isValid = await verifyEmailToken(validation.data.token);
    if (!isValid) {
      return apiError("Invalid or expired verification code.", 400);
    }

    return apiSuccess({ message: "Email verified successfully." });
  } catch (error) {
    return apiInternalError(error, "An unexpected error occurred during email verification.");
  }
}
