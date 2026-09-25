import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!token || password.length < 8 || password.length > 256) return NextResponse.json({ error: "Invalid reset request." }, { status: 400 });
  if (!(await resetPassword(token, password))) return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
  return NextResponse.json({ success: true });
}
