import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { getUser, updateUser } from "@/lib/db/data-access";
import { cookies } from "next/headers";
import { createHmac } from "node:crypto";

/** Duplicate of the session signing logic from auth/server.ts so we can call it from a Route Handler (which cannot import "use server" modules). */
function getAuthSecret() {
  return process.env.AUTH_SECRET || "buildora_super_secret_session_key_32_chars_minimum_length_fallback";
}
function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}
function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}
function buildSessionToken(payload: Record<string, unknown>) {
  const body = encode(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ name: user.name, email: user.email });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
    }
    if ("email" in body) {
      return NextResponse.json({ error: "Email addresses cannot be changed from this page." }, { status: 400 });
    }
    const name = "name" in body && typeof body.name === "string" ? body.name.trim() : "";

    if (name.length < 2 || name.length > 160) {
      return NextResponse.json({ error: "Name must be between 2 and 160 characters." }, { status: 400 });
    }

    const account = await getUser({ id: user.id });
    if (!account || account.deletedAt || account.accountStatus !== "active") {
      return NextResponse.json({ error: "Your account profile could not be found. Please sign in again." }, { status: 404 });
    }

    const updated = await updateUser({ id: user.id }, { name });

    // Refresh the session cookie with the updated name so dashboard/profile reflects it immediately
    const sessionLifetimeSeconds = 60 * 60 * 24 * 7;
    const token = buildSessionToken({
      userId: user.id,
      role: user.role,
      email: account.email,
      name,
      expiresAt: Date.now() + sessionLifetimeSeconds * 1000,
    });
    const cookieStore = await cookies();
    cookieStore.set("buildora_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: sessionLifetimeSeconds,
    });

    return NextResponse.json({ success: true, account: { name: updated.name, email: account.email } });
  } catch (error) {
    console.error("[api/client/profile] Failed to update profile:", error);
    return NextResponse.json({ error: "Unable to update your profile." }, { status: 500 });
  }
}
