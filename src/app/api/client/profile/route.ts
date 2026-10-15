import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, setSession } from "@/lib/auth/server";
import { getUser, updateUser } from "@/lib/db/data-access";

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

    await setSession(user.id, user.role, account.email, name);

    return NextResponse.json({ success: true, account: { name: updated.name, email: account.email } });
  } catch (error) {
    console.error("[api/client/profile] Failed to update profile:", error);
    const message = error instanceof Error ? error.message : "Unable to update your profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
