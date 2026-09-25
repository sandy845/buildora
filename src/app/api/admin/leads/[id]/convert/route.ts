import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id } = await params;
  try {
    const body = await request.json() as { customerId?: unknown; name?: unknown; location?: unknown; description?: unknown };
    const lead = await prisma.lead.findFirst({ where: { id, deletedAt: null }, select: { id: true, name: true, email: true, location: true, projectBrief: true, status: true } });
    if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    const customerId = typeof body.customerId === "string" && body.customerId ? body.customerId : (await prisma.user.findFirst({ where: { normalizedEmail: lead.email.toLowerCase(), role: "customer", deletedAt: null }, select: { id: true } }))?.id;
    if (!customerId) return NextResponse.json({ error: "Create or select a customer account before converting this lead." }, { status: 400 });
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : `${lead.name}'s project`;
    const location = typeof body.location === "string" && body.location.trim() ? body.location.trim() : lead.location;
    const result = await prisma.$transaction(async (tx: any) => {
      const project = await tx.project.create({ data: { customerId, originatingLeadId: lead.id, name, slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`, location, description: typeof body.description === "string" ? body.description.trim() : lead.projectBrief, status: "planning", progress: 0 } });
      const updatedLead = await tx.lead.update({ where: { id: lead.id }, data: { customerId, status: "converted", convertedAt: new Date() }, select: { id: true, status: true } });
      await tx.notification.create({ data: { userId: customerId, projectId: project.id, type: "project_update", title: "Your project has been created", body: `Buildora created ${project.name} from your enquiry.` } });
      return { project, updatedLead };
    });
    await recordAudit({ actorId: user.id, projectId: result.project.id, entityType: "lead", entityId: lead.id, action: "converted_to_project", before: { status: lead.status }, after: result.updatedLead });
    return NextResponse.json({ success: true, projectId: result.project.id });
  } catch (error) {
    console.error("[api/admin/leads/:id/convert] Failed to convert lead:", error);
    return NextResponse.json({ error: "Unable to convert lead to project." }, { status: 500 });
  }
}
