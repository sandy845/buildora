import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit";

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const customerId = typeof body.customerId === "string" ? body.customerId : "";
    const leadId = typeof body.leadId === "string" && body.leadId ? body.leadId : undefined;
    const location = typeof body.location === "string" ? body.location.trim() : undefined;
    if (!name || !customerId) return NextResponse.json({ error: "Name and customer are required." }, { status: 400 });
    const customer = await prisma.user.findFirst({ where: { id: customerId, role: "customer", deletedAt: null }, select: { id: true } });
    if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    const lead = leadId ? await prisma.lead.findFirst({ where: { id: leadId, deletedAt: null }, select: { id: true, customerId: true, status: true } }) : null;
    if (leadId && !lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
    if (lead && lead.customerId && lead.customerId !== customerId) return NextResponse.json({ error: "The selected lead belongs to a different customer." }, { status: 400 });
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`;
    const project = await prisma.$transaction(async (tx: any) => {
      const createdProject = await tx.project.create({
        data: { name, slug, customerId, originatingLeadId: leadId, location, description: typeof body.description === "string" ? body.description.trim() : undefined },
        select: { id: true, name: true, slug: true, status: true },
      });
      if (lead) {
        await tx.lead.update({ where: { id: lead.id }, data: { customerId, status: "converted", convertedAt: new Date() } });
        await tx.notification.create({ data: { userId: customerId, projectId: createdProject.id, type: "project_update", title: "Your project has been created", body: `Buildora created ${createdProject.name} from your enquiry.` } });
      }
      return createdProject;
    });
    await recordAudit({ actorId: user.id, projectId: project.id, entityType: "project", entityId: project.id, action: "created", after: project });
    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    console.error("[api/admin/projects] Failed to create project:", error);
    return NextResponse.json({ error: "Unable to create project." }, { status: 500 });
  }
}
