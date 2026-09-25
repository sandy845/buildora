import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit";

const statuses = ["new", "contacted", "qualified", "converted", "closed"] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  try {
    const body = await request.json();
    const status = body.status as (typeof statuses)[number];
    if (!statuses.includes(status)) return NextResponse.json({ error: "Invalid lead status." }, { status: 400 });
    const before = await prisma.lead.findFirst({ where: { id, deletedAt: null }, select: { id: true, status: true } });
    if (!before) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    const lead = await prisma.lead.update({
      where: { id },
      data: { status, contactedAt: status !== "new" ? new Date() : undefined, closedAt: status === "closed" ? new Date() : undefined },
      select: { id: true, status: true, contactedAt: true, closedAt: true },
    });
    await recordAudit({ actorId: user.id, entityType: "lead", entityId: id, action: "status_changed", before, after: lead });
    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("[api/admin/leads/:id] Failed to update lead:", error);
    return NextResponse.json({ error: "Unable to update lead." }, { status: 500 });
  }
}
