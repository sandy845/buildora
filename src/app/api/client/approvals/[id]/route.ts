import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit";

const allowedStatuses = ["approved", "rejected", "superseded"] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  try {
    const body = await request.json();
    const status = body.status as (typeof allowedStatuses)[number];
    const comments = typeof body.comments === "string" ? body.comments.trim() : undefined;
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid approval status." }, { status: 400 });
    }

    const approval = await prisma.approval.findUnique({
      where: { id },
      select: { id: true, projectId: true, project: { select: { customerId: true, name: true } }, status: true },
    });
    if (!approval) return NextResponse.json({ error: "Approval not found." }, { status: 404 });
    if (user.role !== "admin" && approval.project.customerId !== user.id) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const result = await tx.approval.update({
        where: { id },
        data: { status, comments, decidedAt: new Date() },
        select: { id: true, status: true, comments: true, decidedAt: true },
      });
      await tx.activityEvent.create({
        data: {
          projectId: approval.projectId,
          actorId: user.id,
          type: status === "approved" ? "approved" : "rejected",
          entityType: "approval",
          entityId: id,
          description: `Approval ${status} for ${approval.project.name}`,
        },
      });
      return result;
    });
    await recordAudit({ actorId: user.id, projectId: approval.projectId, entityType: "approval", entityId: id, action: `status_${status}`, before: { status: approval.status }, after: updated });
    return NextResponse.json({ success: true, approval: updated });
  } catch (error) {
    console.error("[api/client/approvals] Failed to update approval:", error);
    return NextResponse.json({ error: "Unable to update approval." }, { status: 500 });
  }
}
