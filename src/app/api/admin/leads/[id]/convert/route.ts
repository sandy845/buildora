import { NextRequest } from "next/server";
import { prisma, type PrismaTransactionClient } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit";
import {
  AdminConvertLeadSchema,
  apiError,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  parseAndValidateJson,
  requireAdminRoute,
} from "@/lib/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminRoute();
  if (!guard.authorized) {
    return guard.response;
  }
  const user = guard.user;
  const { id } = await params;

  try {
    const validation = await parseAndValidateJson(request, AdminConvertLeadSchema);
    if (!validation.success) {
      return validation.response;
    }

    const body = validation.data;
    const lead = await prisma.lead.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        location: true,
        projectBrief: true,
        status: true,
      },
    });

    if (!lead) {
      return apiNotFound("Lead not found.");
    }

    let customerId = body.customerId;
    if (!customerId) {
      const existingCustomer = await prisma.user.findFirst({
        where: {
          normalizedEmail: lead.email.toLowerCase(),
          role: "customer",
          deletedAt: null,
        },
        select: { id: true },
      });
      customerId = existingCustomer?.id;
    }

    if (!customerId) {
      return apiError(
        "Create or select a customer account before converting this lead.",
        400
      );
    }

    const name = body.name || `${lead.name}'s project`;
    const location = body.location || lead.location;
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`;

    const result = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const project = await tx.project.create({
        data: {
          customerId,
          originatingLeadId: lead.id,
          name,
          slug,
          location,
          description: body.description || lead.projectBrief,
          status: "planning",
          progress: 0,
        },
      });

      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: { customerId, status: "converted", convertedAt: new Date() },
        select: { id: true, status: true },
      });

      await tx.notification.create({
        data: {
          userId: customerId,
          projectId: project.id,
          type: "project_update",
          title: "Your project has been created",
          body: `Buildora created ${project.name} from your enquiry.`,
        },
      });

      return { project, updatedLead };
    });

    await recordAudit({
      actorId: user.id,
      projectId: result.project.id,
      entityType: "lead",
      entityId: lead.id,
      action: "converted_to_project",
      before: { status: lead.status },
      after: result.updatedLead,
    });

    return apiSuccess({ projectId: result.project.id });
  } catch (error) {
    return apiInternalError(error, "Unable to convert lead to project.");
  }
}
