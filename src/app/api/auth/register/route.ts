import { NextRequest, NextResponse } from "next/server";
import { authRegisterLimiter, getClientIp, getRateLimitHeaders } from "@/lib/rate-limit";
import { registerUser } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rateCheck = await authRegisterLimiter.checkAsync(ip);
    const rateHeaders = getRateLimitHeaders(rateCheck, authRegisterLimiter.limit);

    if (!rateCheck.success) {
      const retrySeconds = Math.ceil(rateCheck.retryAfterMs / 1000);
      return NextResponse.json(
        {
          error: `Too many registration attempts. Please try again in ${retrySeconds} seconds.`,
          retryAfterSeconds: retrySeconds,
        },
        {
          status: 429,
          headers: rateHeaders,
        }
      );
    }

    const body = await req.json();
    const result = await registerUser(body);

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
      { success: true, message: "Account created successfully." },
      {
        status: 201,
        headers: rateHeaders,
      }
    );
  } catch (error) {
    console.error("[api/auth/register] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
