import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  try {
    const body = await request.json();
    const data: { name?: string; location?: string; status?: "planning" | "in_progress" | "on_hold" | "completed" | "cancelled"; progress?: number; targetCompletionDate?: Date } = {};
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (typeof body.location === "string") data.location = body.location.trim();
    if (["planning", "in_progress", "on_hold", "completed", "cancelled"].includes(body.status)) data.status = body.status;
    if (typeof body.progress === "number" && body.progress >= 0 && body.progress <= 100) data.progress = body.progress;
    if (body.targetCompletionDate) {
      const date = new Date(body.targetCompletionDate);
      if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "Invalid completion date." }, { status: 400 });
      data.targetCompletionDate = date;
    }
    if (!Object.keys(data).length) return NextResponse.json({ error: "No valid project changes supplied." }, { status: 400 });
    const before = await prisma.project.findFirst({ where: { id, deletedAt: null }, select: { id: true, name: true, location: true, status: true, progress: true, targetCompletionDate: true } });
    if (!before) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    const project = await prisma.project.update({ where: { id }, data, select: { id: true, name: true, status: true, progress: true } });
    await recordAudit({ actorId: user.id, projectId: id, entityType: "project", entityId: id, action: "updated", before, after: project });
    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("[api/admin/projects/:id] Failed to update project:", error);
    return NextResponse.json({ error: "Unable to update project." }, { status: 500 });
  }
}
