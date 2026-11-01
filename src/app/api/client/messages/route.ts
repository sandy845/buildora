import { NextRequest } from "next/server";
import { prisma, type PrismaTransactionClient } from "@/lib/db/prisma";
import { canAccessProject } from "@/lib/services/shared";
import {
  apiForbidden,
  apiInternalError,
  apiNotFound,
  apiSuccess,
  apiTooManyRequests,
  ClientSendMessageSchema,
  parseAndValidateJson,
  requireRouteUser,
} from "@/lib/api";
import {
  clientMessageLimiter,
  getClientIp,
  getRateLimitHeaders,
} from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const guard = await requireRouteUser();
  if (!guard.authorized) {
    return guard.response;
  }
  const user = guard.user;

  try {
    const ip = getClientIp(request.headers);
    const rateCheck = await clientMessageLimiter.checkAsync(`${ip}:${user.id}`);
    const rateHeaders = getRateLimitHeaders(rateCheck, clientMessageLimiter.limit);

    if (!rateCheck.success) {
      const retrySeconds = Math.ceil(rateCheck.retryAfterMs / 1000);
      return apiTooManyRequests(
        `You are sending messages too quickly. Please wait ${retrySeconds} seconds.`,
        rateHeaders
      );
    }
    const validation = await parseAndValidateJson(request, ClientSendMessageSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { projectId, conversationId, body: messageBody } = validation.data;

    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true, name: true, customerId: true },
    });

    if (!project) {
      return apiNotFound("Project not found.");
    }

    if (!canAccessProject(user, project.customerId)) {
      return apiForbidden("You do not have permission to post messages to this project.");
    }

    const conversation = conversationId
      ? await prisma.conversation.findFirst({ where: { id: conversationId, projectId } })
      : await prisma.conversation.create({
          data: { projectId, type: "project", subject: `${project.name} updates` },
        });

    if (!conversation) {
      return apiNotFound("Conversation not found.");
    }

    const result = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const message = await tx.message.create({
        data: { conversationId: conversation.id, senderId: user.id, body: messageBody },
        select: { id: true, body: true, sentAt: true, conversationId: true },
      });

      if (user.role === "customer") {
        const admins = await tx.user.findMany({
          where: { role: "admin", accountStatus: "active", deletedAt: null },
          select: { id: true },
        });
        if (admins.length) {
          await tx.notification.createMany({
            data: admins.map((admin: { id: string }) => ({
              userId: admin.id,
              projectId,
              type: "message" as const,
              title: "New project message",
              body: `${user.name} sent a new message in ${project.name}.`,
            })),
          });
        }
      }

      return message;
    });

    return apiSuccess({ message: result });
  } catch (error) {
    return apiInternalError(error, "Unable to send message.");
  }
}
