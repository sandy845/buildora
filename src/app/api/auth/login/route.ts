import { NextRequest, NextResponse } from "next/server";
import { authLoginLimiter, getClientIp, getRateLimitHeaders } from "@/lib/rate-limit";
import { loginUser } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rateCheck = await authLoginLimiter.checkAsync(ip);
    const rateHeaders = getRateLimitHeaders(rateCheck, authLoginLimiter.limit);

    if (!rateCheck.success) {
      const retrySeconds = Math.ceil(rateCheck.retryAfterMs / 1000);
      return NextResponse.json(
        {
          error: `Too many login attempts. Please try again in ${retrySeconds} seconds.`,
          retryAfterSeconds: retrySeconds,
        },
        {
          status: 429,
          headers: rateHeaders,
        }
      );
    }

    const body = await req.json();
    const result = await loginUser(body);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        {
          status: 400,
          headers: rateHeaders,
        }
      );
    }

    return NextResponse.json(
      { success: true, role: result.role },
      {
        status: 200,
        headers: rateHeaders,
      }
    );
  } catch (error) {
    console.error("[api/auth/login] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
