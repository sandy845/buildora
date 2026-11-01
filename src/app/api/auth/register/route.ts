import { NextRequest } from "next/server";
import { authRegisterLimiter, getClientIp, getRateLimitHeaders } from "@/lib/rate-limit";
import { registerUser } from "@/lib/auth/server";
import {
  apiError,
  apiInternalError,
  apiSuccess,
  apiTooManyRequests,
  parseAndValidateJson,
  RegisterRequestSchema,
} from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rateCheck = await authRegisterLimiter.checkAsync(ip);
    const rateHeaders = getRateLimitHeaders(rateCheck, authRegisterLimiter.limit);

    if (!rateCheck.success) {
      const retrySeconds = Math.ceil(rateCheck.retryAfterMs / 1000);
      return apiTooManyRequests(
        `Too many registration attempts. Please try again in ${retrySeconds} seconds.`,
        rateHeaders
      );
    }

    const validation = await parseAndValidateJson(req, RegisterRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const result = await registerUser(validation.data);
    if (result.error) {
      return apiError(result.error, 400, { headers: rateHeaders });
    }

    return apiSuccess({ message: "Account created successfully." }, 201, rateHeaders);
  } catch (error) {
    return apiInternalError(error, "An unexpected error occurred during registration.");
  }
}
