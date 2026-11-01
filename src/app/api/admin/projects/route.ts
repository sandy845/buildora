import { NextRequest } from "next/server";
import { prisma, type PrismaTransactionClient } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit";
import {
  AdminCreateProjectSchema,
  apiError,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  parseAndValidateJson,
  requireAdminRoute,
} from "@/lib/api";

export async function POST(request: NextRequest) {
  const guard = await requireAdminRoute();
  if (!guard.authorized) {
    return guard.response;
  }
  const user = guard.user;

  try {
    const validation = await parseAndValidateJson(request, AdminCreateProjectSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { name, customerId, leadId, location, description } = validation.data;

    const customer = await prisma.user.findFirst({
      where: { id: customerId, role: "customer", deletedAt: null },
      select: { id: true },
    });
    if (!customer) {
      return apiNotFound("Customer not found.");
    }

    const lead = leadId
      ? await prisma.lead.findFirst({
          where: { id: leadId, deletedAt: null },
          select: { id: true, customerId: true, status: true },
        })
      : null;

    if (leadId && !lead) {
      return apiNotFound("Lead not found.");
    }
    if (lead && lead.customerId && lead.customerId !== customerId) {
      return apiError("The selected lead belongs to a different customer.", 400);
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`;

    const project = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const createdProject = await tx.project.create({
        data: {
          name,
          slug,
          customerId,
          originatingLeadId: leadId,
          location,
          description,
        },
        select: { id: true, name: true, slug: true, status: true },
      });

      if (lead) {
        await tx.lead.update({
          where: { id: lead.id },
          data: { customerId, status: "converted", convertedAt: new Date() },
        });
        await tx.notification.create({
          data: {
            userId: customerId,
            projectId: createdProject.id,
            type: "project_update",
            title: "Your project has been created",
            body: `Buildora created ${createdProject.name} from your enquiry.`,
          },
        });
      }
      return createdProject;
    });

    await recordAudit({
      actorId: user.id,
      projectId: project.id,
      entityType: "project",
      entityId: project.id,
      action: "created",
      after: project,
    });

    return apiSuccess({ project }, 201);
  } catch (error) {
    return apiInternalError(error, "Unable to create project.");
  }
}
