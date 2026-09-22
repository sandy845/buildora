import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { sendApprovalReminderEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { approvalId } = body;

    if (!approvalId) {
      return NextResponse.json({ error: "Missing approvalId." }, { status: 400 });
    }

    // Load approval with project and customer details
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
      return NextResponse.json(
        { error: "Approval not found or already decided." },
        { status: 404 }
      );
    }

    // Only admin or project customer can trigger reminders
    if (user.role !== "admin" && user.id !== approval.project.customerId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const recipient = approval.project.customer;
    if (!recipient || !recipient.email) {
      return NextResponse.json({ error: "Project customer has no email address." }, { status: 400 });
    }

    const approvalTitle =
      approval.document?.name ||
      approval.designAsset?.name ||
      approval.milestone?.name ||
      (approval.quotation ? `Quotation #${approval.quotation.quotationNumber}` : `${approval.targetType} approval`);

    const dueDate = approval.milestone?.dueDate
      ? new Date(approval.milestone.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
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

    // Record activity event
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

    return NextResponse.json({
      success: true,
      emailResult,
      sentTo: recipient.email,
    });
  } catch (error) {
    console.error("[api/approvals/remind] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
