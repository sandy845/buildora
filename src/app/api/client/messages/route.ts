import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await request.json();
    const projectId = typeof body.projectId === "string" ? body.projectId : "";
    const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
    const messageBody = typeof body.body === "string" ? body.body.trim() : "";
    if (!projectId || !messageBody || messageBody.length > 5000) {
      return NextResponse.json({ error: "Project and message text are required." }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null, ...(user.role === "admin" ? {} : { customerId: user.id }) },
      select: { id: true, name: true, customerId: true },
    });
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

    const conversation = conversationId
      ? await prisma.conversation.findFirst({ where: { id: conversationId, projectId } })
      : await prisma.conversation.create({ data: { projectId, type: "project", subject: `${project.name} updates` } });
    if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

    const result = await prisma.$transaction(async (tx: any) => {
      const message = await tx.message.create({
        data: { conversationId: conversation.id, senderId: user.id, body: messageBody },
        select: { id: true, body: true, sentAt: true, conversationId: true },
      });
      if (user.role === "customer") {
        const admins = await tx.user.findMany({ where: { role: "admin", accountStatus: "active", deletedAt: null }, select: { id: true } });
        if (admins.length) {
          await tx.notification.createMany({
            data: admins.map((admin: any) => ({ userId: admin.id, projectId, type: "message" as const, title: "New project message", body: `${user.name} sent a new message in ${project.name}.` })),
          });
        }
      }
      return message;
    });
    return NextResponse.json({ success: true, message: result });
  } catch (error) {
    console.error("[api/client/messages] Failed to send message:", error);
    return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  }
}
