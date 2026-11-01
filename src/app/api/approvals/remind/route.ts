import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendApprovalReminderEmail } from "@/lib/email";
import {
  apiError,
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  IdSchema,
  parseAndValidateJson,
  requireRouteUser,
} from "@/lib/api";
import { z } from "zod";

const ApprovalRemindSchema = z.object({
  approvalId: IdSchema,
});

export async function POST(req: NextRequest) {
  const guard = await requireRouteUser();
  if (!guard.authorized) {
    return guard.response;
  }
  const user = guard.user;

  try {
    const validation = await parseAndValidateJson(req, ApprovalRemindSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { approvalId } = validation.data;

    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        project: {
          include: {
            customer: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        document: { select: { name: true } },
        designAsset: { select: { name: true } },
        milestone: { select: { name: true, dueDate: true } },
        quotation: { select: { quotationNumber: true } },
      },
    });

    if (!approval || approval.status !== "pending") {
      return apiNotFound("Approval request not found or already decided.");
    }

    if (user.role !== "admin" && user.id !== approval.project.customerId) {
      return apiForbidden("You do not have permission to trigger reminders for this approval.");
    }

    const recipient = approval.project.customer;
    if (!recipient || !recipient.email) {
      return apiError("Project customer has no valid email address.", 400);
    }

    const approvalTitle =
      approval.document?.name ||
      approval.designAsset?.name ||
      approval.milestone?.name ||
      (approval.quotation
        ? `Quotation #${approval.quotation.quotationNumber}`
        : `${approval.targetType} approval`);

    const dueDate = approval.milestone?.dueDate
      ? new Date(approval.milestone.dueDate).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : undefined;

    const emailResult = await sendApprovalReminderEmail({
      recipientName: recipient.name,
      recipientEmail: recipient.email,
      projectName: approval.project.name,
      approvalTitle,
      approvalType: approval.targetType,
      referenceId: approval.id,
      dueDate,
      reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/client/projects/${approval.projectId}#approvals`,
    });

    await prisma.activityEvent.create({
      data: {
        projectId: approval.projectId,
        actorId: user.id,
        type: "message_sent",
        entityType: "approval",
        entityId: approval.id,
        description: `Approval reminder email sent to ${recipient.name}`,
      },
    });

    return apiSuccess({
      emailResult,
      sentTo: recipient.email,
    });
  } catch (error) {
    return apiInternalError(error, "Failed to send approval reminder.");
  }
}
