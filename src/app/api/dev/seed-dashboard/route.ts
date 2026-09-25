import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";

const seedProjectId = "22222222-2222-2222-2222-222222222222";
const seedPhaseId = "22222222-2222-2222-2222-222222222223";
const seedMilestoneId = "22222222-2222-2222-2222-222222222224";
const seedQuotationId = "22222222-2222-2222-2222-222222222225";
const seedLineItemId = "22222222-2222-2222-2222-222222222226";
const seedPaymentId = "22222222-2222-2222-2222-222222222227";
const seedDocumentId = "22222222-2222-2222-2222-222222222228";
const seedVersionId = "22222222-2222-2222-2222-222222222229";
const seedConversationId = "22222222-2222-2222-2222-222222222230";
const seedParticipantId = "22222222-2222-2222-2222-222222222231";
const seedMessageId = "22222222-2222-2222-2222-222222222232";
const seedNotificationId = "22222222-2222-2222-2222-222222222233";
const seedApprovalId = "22222222-2222-2222-2222-222222222234";
const seedActivityId = "22222222-2222-2222-2222-222222222235";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Development seed is disabled in production." }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  if (user.role !== "customer") return NextResponse.json({ error: "Only customer accounts can be seeded." }, { status: 403 });

  await prisma.$transaction(async (tx: any) => {
    await tx.project.upsert({
      where: { id: seedProjectId },
      update: { customerId: user.id, progress: 68, status: "in_progress", deletedAt: null },
      create: {
        id: seedProjectId,
        customerId: user.id,
        name: "Residence 01",
        slug: `residence-01-${user.id.slice(0, 8)}`,
        location: "Worli, Mumbai",
        description: "A contemporary residence with coordinated architectural and interior works.",
        status: "in_progress",
        progress: 68,
      },
    });
    await tx.projectPhase.upsert({
      where: { id: seedPhaseId },
      update: { projectId: seedProjectId, progress: 68, status: "active" },
      create: { id: seedPhaseId, projectId: seedProjectId, name: "Construction & interiors", status: "active", progress: 68, sortOrder: 1 },
    });
    await tx.projectMilestone.upsert({
      where: { id: seedMilestoneId },
      update: { projectId: seedProjectId, phaseId: seedPhaseId, status: "in_progress" },
      create: { id: seedMilestoneId, projectId: seedProjectId, phaseId: seedPhaseId, name: "Electrical & plumbing", status: "in_progress", dueDate: new Date("2026-09-24"), sortOrder: 1 },
    });
    await tx.quotation.upsert({
      where: { id: seedQuotationId },
      update: { projectId: seedProjectId, createdById: user.id, status: "sent", subtotal: 845000, tax: 152100, total: 997100 },
      create: { id: seedQuotationId, projectId: seedProjectId, createdById: user.id, quotationNumber: "QT-2026-001", status: "sent", subtotal: 845000, tax: 152100, total: 997100, validUntil: new Date("2026-09-30"), notes: "Interior and construction works quotation." },
    });
    await tx.quotationLineItem.upsert({
      where: { id: seedLineItemId },
      update: { quotationId: seedQuotationId, description: "Electrical, plumbing and interior works", quantity: 1, unitPrice: 845000, amount: 845000 },
      create: { id: seedLineItemId, quotationId: seedQuotationId, description: "Electrical, plumbing and interior works", quantity: 1, unitPrice: 845000, amount: 845000, sortOrder: 1 },
    });
    await tx.payment.upsert({
      where: { id: seedPaymentId },
      update: { projectId: seedProjectId, recordedById: user.id, amount: 125000, currency: "INR", status: "pending", method: "bank_transfer", notes: "First construction milestone payment." },
      create: { id: seedPaymentId, projectId: seedProjectId, recordedById: user.id, amount: 125000, currency: "INR", status: "pending", method: "bank_transfer", reference: "BM-2026-001", notes: "First construction milestone payment." },
    });
    await tx.document.upsert({
      where: { id: seedDocumentId },
      update: { projectId: seedProjectId, name: "Residence 01 — Floor plan", type: "plan", deletedAt: null },
      create: { id: seedDocumentId, projectId: seedProjectId, name: "Residence 01 — Floor plan", type: "plan", description: "Approved floor plan for the residence." },
    });
    await tx.documentVersion.upsert({
      where: { id: seedVersionId },
      update: { documentId: seedDocumentId, version: 1, fileUrl: "/demo/residence-01-floor-plan.pdf", fileName: "residence-01-floor-plan.pdf", mimeType: "application/pdf" },
      create: { id: seedVersionId, documentId: seedDocumentId, version: 1, fileUrl: "/demo/residence-01-floor-plan.pdf", fileName: "residence-01-floor-plan.pdf", mimeType: "application/pdf", fileSize: 245760 },
    });
    await tx.conversation.upsert({
      where: { id: seedConversationId },
      update: { projectId: seedProjectId, subject: "Residence 01 project updates" },
      create: { id: seedConversationId, projectId: seedProjectId, type: "project", subject: "Residence 01 project updates" },
    });
    await tx.conversationParticipant.upsert({
      where: { id: seedParticipantId },
      update: { conversationId: seedConversationId, userId: user.id },
      create: { id: seedParticipantId, conversationId: seedConversationId, userId: user.id },
    });
    await tx.message.upsert({
      where: { id: seedMessageId },
      update: { conversationId: seedConversationId, senderId: user.id, body: "Your electrical and plumbing phase is progressing well." },
      create: { id: seedMessageId, conversationId: seedConversationId, senderId: user.id, body: "Your electrical and plumbing phase is progressing well." },
    });
    await tx.notification.upsert({
      where: { id: seedNotificationId },
      update: { userId: user.id, projectId: seedProjectId, type: "project_update", title: "Project update available", body: "Residence 01 has reached 68% progress.", readAt: null },
      create: { id: seedNotificationId, userId: user.id, projectId: seedProjectId, type: "project_update", title: "Project update available", body: "Residence 01 has reached 68% progress." },
    });
    await tx.approval.upsert({
      where: { id: seedApprovalId },
      update: { projectId: seedProjectId, quotationId: seedQuotationId, requestedById: user.id, targetType: "quotation", status: "pending" },
      create: { id: seedApprovalId, projectId: seedProjectId, quotationId: seedQuotationId, requestedById: user.id, targetType: "quotation", status: "pending", comments: "Please review the construction quotation." },
    });
    await tx.activityEvent.upsert({
      where: { id: seedActivityId },
      update: { projectId: seedProjectId, actorId: user.id, type: "updated", entityType: "project", entityId: seedProjectId, description: "Residence 01 progress updated to 68%" },
      create: { id: seedActivityId, projectId: seedProjectId, actorId: user.id, type: "updated", entityType: "project", entityId: seedProjectId, description: "Residence 01 progress updated to 68%" },
    });
  });

  return NextResponse.json({ success: true });
}
