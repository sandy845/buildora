import { NextRequest, NextResponse } from "next/server";
import { createFirebaseSession } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body?.idToken;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "Missing or invalid ID token." }, { status: 400 });
    }

    const result = await createFirebaseSession(idToken, {
      name: body.name,
      email: body.email,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Authentication failed." }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      role: result.role,
      user: result.user,
    });
  } catch (err: unknown) {
    console.error("[api/auth/session] Session creation error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
