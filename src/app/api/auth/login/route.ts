import { NextRequest } from "next/server";
import { authLoginLimiter, getClientIp, getRateLimitHeaders } from "@/lib/rate-limit";
import { loginUser } from "@/lib/auth/server";
import {
  apiError,
  apiInternalError,
  apiSuccess,
  apiTooManyRequests,
  LoginRequestSchema,
  parseAndValidateJson,
} from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rateCheck = await authLoginLimiter.checkAsync(ip);
    const rateHeaders = getRateLimitHeaders(rateCheck, authLoginLimiter.limit);

    if (!rateCheck.success) {
      const retrySeconds = Math.ceil(rateCheck.retryAfterMs / 1000);
      return apiTooManyRequests(
        `Too many login attempts. Please try again in ${retrySeconds} seconds.`,
        rateHeaders
      );
    }

    const validation = await parseAndValidateJson(req, LoginRequestSchema);
    if (!validation.success) {
      return validation.response;
    }

    const result = await loginUser(validation.data);
    if (result.error) {
      return apiError(result.error, 400, { headers: rateHeaders });
    }

    return apiSuccess({ role: result.role }, 200, rateHeaders);
  } catch (error) {
    return apiInternalError(error, "An unexpected error occurred during login.");
  }
}
