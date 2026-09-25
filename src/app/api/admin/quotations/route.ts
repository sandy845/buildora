import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const body = await request.json();
    const projectId = typeof body.projectId === "string" ? body.projectId : "";
    const quotationNumber = typeof body.quotationNumber === "string" ? body.quotationNumber.trim() : "";
    const subtotal = Number(body.subtotal);
    const tax = Number(body.tax ?? 0);
    if (!projectId || !quotationNumber || !Number.isFinite(subtotal) || subtotal < 0 || !Number.isFinite(tax) || tax < 0) {
      return NextResponse.json({ error: "Project, quotation number, subtotal, and tax are required." }, { status: 400 });
    }
    const project = await prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true, customerId: true, name: true } });
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const quotation = await prisma.quotation.create({
      data: { projectId, createdById: user.id, quotationNumber, subtotal, tax, total: subtotal + tax, status: "draft" },
      select: { id: true, quotationNumber: true, status: true, total: true },
    });
    await recordAudit({ actorId: user.id, projectId, entityType: "quotation", entityId: quotation.id, action: "created", after: quotation });
    await prisma.notification.create({
      data: { userId: project.customerId, projectId, type: "approval_required", title: "Quotation ready", body: `A new quotation is available for ${project.name}.` },
    });
    return NextResponse.json({ success: true, quotation }, { status: 201 });
  } catch (error) {
    console.error("[api/admin/quotations] Failed to create quotation:", error);
    return NextResponse.json({ error: "Unable to create quotation." }, { status: 500 });
  }
}
