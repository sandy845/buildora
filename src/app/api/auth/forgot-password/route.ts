import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth/server";
import { validateReset } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (Object.keys(validateReset({ email })).length) return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
  await requestPasswordReset(email);
  return NextResponse.json({ success: true });
}
