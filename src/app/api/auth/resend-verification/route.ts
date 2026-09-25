import { NextRequest, NextResponse } from "next/server";
import { resendVerificationEmail } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: unknown };
    if (typeof body.email !== "string" || !body.email.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }
    const result = await resendVerificationEmail(body.email);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/auth/resend-verification] Unexpected error:", error);
    return NextResponse.json({ error: "Unable to resend verification email." }, { status: 500 });
  }
}
