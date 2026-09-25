import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;

  try {
    const body = await request.json();
    const status = body.status;
    if (user.role !== "admin" && !["accepted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid quotation action." }, { status: 400 });
    }
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      select: { id: true, projectId: true, status: true, project: { select: { customerId: true, name: true } } },
    });
    if (!quotation || !quotation.projectId || !quotation.project) return NextResponse.json({ error: "Quotation not found." }, { status: 404 });
    if (user.role !== "admin" && quotation.project.customerId !== user.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

    const updated = await prisma.quotation.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
    await recordAudit({ actorId: user.id, projectId: quotation.projectId, entityType: "quotation", entityId: id, action: `status_${status}`, before: { status: quotation.status }, after: updated });
    return NextResponse.json({ success: true, quotation: updated });
  } catch (error) {
    console.error("[api/client/quotations] Failed to update quotation:", error);
    return NextResponse.json({ error: "Unable to update quotation." }, { status: 500 });
  }
}
