import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth/server";
import { authVerificationAttemptLimiter, getClientIp, getRateLimitHeaders } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const rateCheck = await authVerificationAttemptLimiter.checkAsync(getClientIp(request.headers));
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please try again later." },
      { status: 429, headers: getRateLimitHeaders(rateCheck, authVerificationAttemptLimiter.limit) },
    );
  }
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  if (!token || !(await verifyEmailToken(token))) return NextResponse.json({ error: "Invalid or expired verification code." }, { status: 400 });
  return NextResponse.json({ success: true });
}
