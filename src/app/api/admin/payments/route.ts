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
    const amount = Number(body.amount);
    const currency = typeof body.currency === "string" ? body.currency.toUpperCase() : "INR";
    const statuses = ["pending", "partially_paid", "paid", "overdue", "failed", "refunded"] as const;
    const methods = ["bank_transfer", "card", "cash", "other"] as const;
    const status = statuses.includes(body.status) ? body.status : "pending";
    const method = body.method === undefined ? undefined : methods.includes(body.method) ? body.method : null;
    if (method === null) return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
    if (!projectId || !Number.isFinite(amount) || amount <= 0 || currency.length !== 3) {
      return NextResponse.json({ error: "Project, positive amount, and three-letter currency are required." }, { status: 400 });
    }
    const project = await prisma.project.findFirst({ where: { id: projectId, deletedAt: null }, select: { id: true, customerId: true, name: true } });
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const payment = await prisma.payment.create({
      data: { projectId, recordedById: user.id, amount, currency, status, method, reference: typeof body.reference === "string" ? body.reference.trim() : undefined, notes: typeof body.notes === "string" ? body.notes.trim() : undefined, paidAt: status === "paid" ? new Date() : undefined },
      select: { id: true, amount: true, currency: true, status: true, paidAt: true },
    });
    await recordAudit({ actorId: user.id, projectId, entityType: "payment", entityId: payment.id, action: "created", after: payment });
    await prisma.notification.create({
      data: { userId: project.customerId, projectId, type: "payment", title: "Payment update", body: `A payment update was recorded for ${project.name}.` },
    });
    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error) {
    console.error("[api/admin/payments] Failed to record payment:", error);
    return NextResponse.json({ error: "Unable to record payment." }, { status: 500 });
  }
}
