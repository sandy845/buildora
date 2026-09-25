import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ name: user.name, email: user.email });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (name.length < 2 || name.length > 160) {
      return NextResponse.json({ error: "Name must be between 2 and 160 characters." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { normalizedEmail: email, id: { not: user.id }, deletedAt: null },
      select: { id: true },
    });
    if (existing) return NextResponse.json({ error: "That email address is already in use." }, { status: 409 });

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name, email, normalizedEmail: email },
      select: { name: true, email: true },
    });
    return NextResponse.json({ success: true, account: updated });
  } catch (error) {
    console.error("[api/client/profile] Failed to update profile:", error);
    return NextResponse.json({ error: "Unable to update your profile." }, { status: 500 });
  }
}
