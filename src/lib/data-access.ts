/* eslint-disable @typescript-eslint/no-explicit-any -- Dynamic Prisma delegates preserve the existing generic data-access API. */
import { getCurrentUser, requireRole } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { process, projects as homeProjects, reasons, services as homeServices, testimonials, trustStats } from "@/data/home";
import { expertise, processSteps, values } from "@/data/site";
import { getProjectBySlug as getMockProjectBySlug, projectCategories, projects } from "@/data/projects";
import { getServiceBySlug as getMockServiceBySlug, services } from "@/data/services";

export type { Project, ProjectCategory } from "@/data/projects";
export type { Service } from "@/data/services";

const clientNavFallback = [
  { label: "Overview", href: "/client/dashboard", icon: "grid" },
  { label: "My Projects", href: "/client/dashboard#projects", icon: "building" },
  { label: "Project Progress", href: "/client/dashboard#progress", icon: "chart" },
  { label: "Timeline", href: "/client/dashboard#timeline", icon: "calendar" },
  { label: "Cost & Payments", href: "/client/dashboard#payments", icon: "card" },
  { label: "Documents", href: "/client/dashboard#documents", icon: "folder" },
  { label: "Design Approvals", href: "/client/dashboard#approvals", icon: "check" },
  { label: "Messages", href: "/client/dashboard#messages", icon: "message", count: 2 },
  { label: "Notifications", href: "/client/dashboard#notifications", icon: "bell", count: 3 },
];

const clientStatsFallback = [
  { label: "Active projects", value: "0", detail: "No active jobs yet", tone: "neutral" },
  { label: "Overall progress", value: "0%", detail: "No project in progress", tone: "positive" },
  { label: "Pending approvals", value: "0", detail: "No pending reviews", tone: "attention" },
  { label: "Outstanding payment", value: "₹0", detail: "All caught up", tone: "attention" },
] as const;

const clientProjectsFallback = [] as const;

const clientActivityFallback = [] as const;

const adminNavFallback = [
  { label: "Overview", href: "/admin/dashboard", icon: "grid" },
  { label: "Projects", href: "/admin/dashboard#projects", icon: "building" },
  { label: "Leads & Enquiries", href: "/admin/dashboard#leads", icon: "user", count: 4 },
  { label: "Quotations", href: "/admin/dashboard#quotations", icon: "file", count: 2 },
  { label: "Finance & Payments", href: "/admin/dashboard#finance", icon: "card" },
  { label: "Client Management", href: "/admin/dashboard#clients", icon: "users" },
  { label: "Project Milestones", href: "/admin/dashboard#milestones", icon: "calendar" },
  { label: "Analytics & Reports", href: "/admin/dashboard#analytics", icon: "chart" },
];

const adminStatsFallback = [
  { label: "Total projects", value: "0", detail: "No projects available", tone: "neutral" },
  { label: "Active projects", value: "0", detail: "No active projects", tone: "positive" },
  { label: "New leads", value: "0", detail: "No leads yet", tone: "attention" },
  { label: "Pending quotations", value: "0", detail: "No quotations pending", tone: "attention" },
] as const;

const adminProjectsFallback = [] as const;

const adminLeadsFallback = [] as const;

const adminActivityFallback = [] as const;

async function getClientDashboardServerSnapshot() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      navItems: [...clientNavFallback],
      stats: [
        { label: "Active projects", value: "0", detail: "No active jobs yet", tone: "neutral" },
        { label: "Overall progress", value: "0%", detail: "No project in progress", tone: "positive" },
        { label: "Pending approvals", value: "0", detail: "No pending reviews", tone: "attention" },
        { label: "Outstanding payment", value: "₹0", detail: "All caught up", tone: "attention" },
      ],
      projects: [],
      activity: [],
      quotations: [],
      documents: [],
      messages: [],
      notifications: [],
      account: null,
      dataUnavailable: false,
    };
  }

  try {
    const [projects, activity, approvalCount, payments, quotations, documents, messages, notifications] = await Promise.all([
      prisma.project.findMany({
        where: { customerId: user.id, deletedAt: null },
        orderBy: { updatedAt: "desc" },
        include: { milestones: { where: { status: { not: "completed" } }, orderBy: { dueDate: "asc" }, take: 1 } },
      }),
      prisma.activityEvent.findMany({
        where: { project: { customerId: user.id } },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      prisma.approval.count({
        where: { status: "pending", project: { customerId: user.id } },
      }),
      prisma.payment.findMany({
        where: { project: { customerId: user.id } },
      }),
      prisma.quotation.findMany({
        where: { project: { customerId: user.id }, deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 3,
      }),
      prisma.document.findMany({
        where: { project: { customerId: user.id }, deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 3,
      }),
      prisma.message.findMany({
        where: { conversation: { project: { customerId: user.id } } },
        orderBy: { sentAt: "desc" },
        take: 3,
      }),
      prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);

    const progressValues = projects.map((p: any) => Number(p.progress || 0));
    const avgProgress = progressValues.length ? Math.round(progressValues.reduce((s: number, v: number) => s + v, 0) / progressValues.length) : 0;

    const unpaidTotal = payments
      .filter((p: any) => ["pending", "partially_paid", "overdue"].includes(p.status))
      .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

    const pendingApprovalCount = projects.length > 0 ? approvalCount : 0;

    return {
      navItems: clientNavFallback.map((item) => (
        item.label === "Messages"
          ? { ...item, count: messages.length || undefined }
          : item.label === "Notifications"
            ? { ...item, count: notifications.filter((n: any) => !n.readAt).length || undefined }
            : item
      )),
      stats: [
        {
          label: "Active projects",
          value: String(projects.length),
          detail: projects.length === 0 ? "No active jobs yet" : `${projects.length} active job${projects.length > 1 ? "s" : ""}`,
          tone: "neutral",
        },
        {
          label: "Overall progress",
          value: `${avgProgress}%`,
          detail: projects.length === 0 ? "No project in progress" : "Across your portfolio",
          tone: "positive",
        },
        {
          label: "Pending approvals",
          value: String(pendingApprovalCount),
          detail: pendingApprovalCount === 0 ? "No pending reviews" : "Needs your review",
          tone: "attention",
        },
        {
          label: "Outstanding payment",
          value: `₹${unpaidTotal.toLocaleString("en-IN")}`,
          detail: unpaidTotal === 0 ? "All caught up" : "Due for review",
          tone: "attention",
        },
      ],
      projects: projects.map((p: any) => ({
        id: p.id,
        name: (p.name as string) || "Your Project",
        type: p.status === "planning" ? "Residential construction" : "Project update",
        location: (p.location as string) || "Your project location",
        progress: Number(p.progress || 0),
        milestone: p.milestones?.[0]?.name || "No milestone scheduled",
        due: p.milestones?.[0]?.dueDate
          ? new Date(p.milestones[0].dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
          : "Pending schedule",
        color: p.status === "completed" ? "bg-emerald-600" : "bg-amber-500",
      })),
      activity: activity.map((e: any) => ({
        title: (e.description as string) || (e.type as string),
        detail: e.createdAt ? new Date(e.createdAt as string).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "Recently",
        icon: "building",
        tone: "dark",
      })),
      quotations: quotations.map((q: any) => ({
        id: q.id,
        title: `Quotation #${q.quotationNumber || q.id}`,
        detail: `₹${Number(q.total || 0).toLocaleString("en-IN")} · ${q.status || "draft"}`,
      })),
      documents: documents.map((d: any) => ({
        id: d.id,
        title: (d.name as string) || "Document",
        detail: `${d.type || "file"} · Updated recently`,
      })),
      messages: messages.map((m: any) => ({
        id: m.id,
        title: (m.body as string) || "",
        detail: "Recently",
      })),
      notifications: notifications.map((n: any) => ({
        id: n.id,
        title: (n.title as string) || "",
        detail: (n.body as string) || "",
        unread: !n.readAt,
      })),
      account: { name: user.name, email: user.email },
      dataUnavailable: false,
    };
  } catch (error) {
    console.warn("[data-access] Using client dashboard empty state due to error:", error);
    return {
      navItems: [...clientNavFallback],
      stats: [
        { label: "Active projects", value: "0", detail: "No active jobs yet", tone: "neutral" },
        { label: "Overall progress", value: "0%", detail: "No project in progress", tone: "positive" },
        { label: "Pending approvals", value: "0", detail: "No pending reviews", tone: "attention" },
        { label: "Outstanding payment", value: "₹0", detail: "All caught up", tone: "attention" },
      ],
      projects: [],
      activity: [],
      quotations: [],
      documents: [],
      messages: [],
      notifications: [],
      account: { name: user.name, email: user.email },
      dataUnavailable: true,
    };
  }
}

async function getAdminDashboardServerSnapshot() {
  await requireRole("admin");

  try {
    const [projectCount, activeProjectCount, leadCount, quotationCount, convertedLeadCount, payments, projects, leads, activity, customers, quotations, projectsByStatus] = await Promise.all([
      prisma.project.count({ where: { deletedAt: null } }),
      prisma.project.count({ where: { status: { in: ["planning", "in_progress"] }, deletedAt: null } }),
      prisma.lead.count({ where: { status: { in: ["new", "contacted"] }, deletedAt: null } }),
      prisma.quotation.count({ where: { status: { in: ["draft", "sent"] }, deletedAt: null } }),
      prisma.lead.count({ where: { status: "converted", deletedAt: null } }),
      prisma.payment.findMany(),
      prisma.project.findMany({ where: { deletedAt: null }, include: { customer: { select: { name: true } }, services: { include: { service: { select: { name: true } } } } }, orderBy: { updatedAt: "desc" }, take: 20 }),
      prisma.lead.findMany({ where: { deletedAt: null }, include: { service: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 10 }),
      prisma.activityEvent.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
      prisma.user.findMany({ where: { role: "customer", deletedAt: null }, select: { id: true, name: true, email: true }, take: 100 }),
      prisma.quotation.findMany({ where: { deletedAt: null } }),
      prisma.project.groupBy({ by: ["status"], where: { deletedAt: null }, _count: { _all: true } }),
    ]);

    const paidTotal = payments.filter((p: any) => ["paid", "partially_paid"].includes(p.status as string)).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    const pendingTotal = payments.filter((p: any) => ["pending", "overdue"].includes(p.status as string)).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    const quotedTotal = quotations.reduce((sum: number, q: any) => sum + Number(q.total || 0), 0);

    const projectList = projects.length > 0 ? projects : [];
    const leadList = leads.length > 0 ? leads : [];

    return {
      navItems: adminNavFallback,
      stats: [
        { label: "Total projects", value: String(projectCount || projectList.length), detail: "Across the portfolio", tone: "neutral" },
        { label: "Active projects", value: String(activeProjectCount), detail: "Currently in motion", tone: "positive" },
        { label: "New leads", value: String(leadCount || leadList.length), detail: "Needs follow-up", tone: "attention" },
        { label: "Pending quotations", value: String(quotationCount || 0), detail: `Total value ₹${(quotedTotal || 0).toLocaleString("en-IN")}`, tone: "attention" },
      ],
      projects: projectList.map((project: any) => ({
        id: project.id,
        name: (project.name as string) || "Project",
        location: (project.location as string) || "Not specified",
        client: (project.customer as { name?: string })?.name || "Client",
        type: (project.services as { service: { name: string } }[]).map(({ service }) => service.name).join(", ") || "Project",
        progress: Number(project.progress || 0),
        status: project.status === "in_progress" ? "On track" : "Review needed",
        updated: project.updatedAt ? new Date(project.updatedAt as string).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "Recently",
      })),
      leads: leadList.map((lead: any) => ({
        id: lead.id,
        name: (lead.name as string) || "Lead",
        email: (lead.email as string) || "",
        location: (lead.location as string) || "",
        service: (lead.service as { name?: string } | null)?.name || "General enquiry",
        source: (lead.source as string) || "Website",
        status: lead.status === "new" ? "New" : "Contacted",
        received: lead.createdAt ? new Date(lead.createdAt as string).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "Recently",
      })),
      activity: activity.length > 0 ? activity.map((event: any) => ({
        title: (event.description as string) || (event.type as string),
        detail: event.createdAt ? new Date(event.createdAt as string).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "Recently",
        icon: "building",
      })) : [],
      finance: {
        received: paidTotal || 0,
        outstanding: pendingTotal || 0,
      },
      reports: {
        quotedValue: quotedTotal || 0,
        convertedLeads: convertedLeadCount,
        projectsByStatus: projectsByStatus.map((entry: any) => ({ status: entry.status, count: entry._count._all })),
      },
      milestones: [],
      calendar: [],
      customers: customers.map((c: any) => ({ id: c.id, name: c.name as string, email: c.email as string })),
      dataUnavailable: false,
    };
  } catch (error) {
    console.warn("[data-access] Admin dashboard unavailable; returning empty state:", error);
    return {
      navItems: adminNavFallback,
      stats: [
        { label: "Total projects", value: "0", detail: "No projects available", tone: "neutral" },
        { label: "Active projects", value: "0", detail: "No active projects", tone: "positive" },
        { label: "New leads", value: "0", detail: "No leads yet", tone: "attention" },
        { label: "Pending quotations", value: "0", detail: "No quotations pending", tone: "attention" },
      ],
      projects: [],
      leads: [],
      activity: [],
      finance: { received: 0, outstanding: 0 },
      reports: {
        quotedValue: 0,
        convertedLeads: 0,
        projectsByStatus: [],
      },
      milestones: [],
      calendar: [],
      customers: [],
      dataUnavailable: true,
    };
  }
}

export async function getClientDashboardDataServer() {
  return getClientDashboardServerSnapshot();
}

export async function getAdminDashboardDataServer() {
  return getAdminDashboardServerSnapshot();
}

export async function getClientProjectById(id: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(user.role === "admin" ? {} : { customerId: user.id }),
      },
      include: {
        services: { include: { service: { select: { name: true } } } },
        phases: { orderBy: { sortOrder: "asc" } },
        milestones: { orderBy: { dueDate: "asc" } },
        timelineEvents: { orderBy: { occurredAt: "desc" }, take: 10 },
        approvals: {
          where: { status: "pending" },
          include: { milestone: { select: { dueDate: true } } },
          orderBy: { createdAt: "desc" },
        },
        documents: {
          where: { deletedAt: null },
          include: { versions: { orderBy: { version: "desc" }, take: 1 } },
          orderBy: { updatedAt: "desc" },
        },
        designs: {
          where: { deletedAt: null },
          include: { approvals: { where: { status: "pending" }, select: { id: true } } },
          orderBy: { updatedAt: "desc" },
        },
        projectMaterials: { include: { material: { select: { name: true, supplier: true } } } },
        payments: { select: { amount: true, status: true } },
      },
    });
    if (!project) return null;

    const activePhase = project.phases.find((phase: any) => phase.status === "active");
    const pendingApproval = project.approvals[0];
    const outstandingPayment = project.payments
      .filter((payment: any) => payment.status === "pending" || payment.status === "partially_paid" || payment.status === "overdue")
      .reduce((total: number, payment: any) => total + Number(payment.amount), 0);
    const dateLabel = (value: Date | null) => value
      ? value.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      : "Not scheduled";

    return {
      id: project.id,
      name: project.name,
      type: project.services.map(({ service }: any) => service.name).join(", ") || "Project",
      location: project.location || "Not specified",
      status: project.status,
      statusDetail: `Updated ${dateLabel(project.updatedAt)}`,
      overallProgress: Math.round(Number(project.progress)),
      startDate: dateLabel(project.startDate),
      targetDate: dateLabel(project.targetCompletionDate),
      currentPhase: activePhase?.name || "No active phase",
      currentPhaseProgress: activePhase ? Math.round(Number(activePhase.progress)) : 0,
      nextAction: pendingApproval
        ? {
            title: `Review ${pendingApproval.targetType.toLowerCase()}`,
            description: pendingApproval.comments || "An item is waiting for your review.",
            due: pendingApproval.milestone?.dueDate ? `Due ${dateLabel(pendingApproval.milestone.dueDate)}` : "",
          }
        : { title: "No action pending", description: "There are no items requiring your review.", due: "" },
      nextMilestone: project.milestones[0]
        ? { name: project.milestones[0].name, progress: 0, date: dateLabel(project.milestones[0].dueDate) }
        : { name: "No milestone scheduled", progress: 0, date: "Not scheduled" },
      phases: project.phases.map((phase: any) => ({
        name: phase.name,
        state: phase.status === "completed" ? "complete" as const : phase.status === "active" ? "current" as const : "upcoming" as const,
        progress: Math.round(Number(phase.progress)),
      })),
      timeline: project.timelineEvents.map((event: any) => ({
        date: dateLabel(event.occurredAt),
        title: event.title,
        detail: event.description || "",
        state: "complete",
      })),
      designs: project.designs.map((design: any) => ({
        name: design.name,
        type: design.type.replaceAll("_", " "),
        status: design.approvals.length ? "Awaiting approval" : "Available",
      })),
      materials: project.projectMaterials.map(({ material }: any) => ({
        name: material.name,
        supplier: material.supplier || "Not specified",
        status: "Added to project",
      })),
      approvals: project.approvals.map((approval: any) => ({
        id: approval.id,
        title: `${approval.targetType[0]?.toUpperCase()}${approval.targetType.slice(1)} review`,
        detail: approval.comments || "Please review this item.",
        due: approval.milestone?.dueDate ? `Due ${dateLabel(approval.milestone.dueDate)}` : "No due date",
      })),
      documents: project.documents.map((document: any) => ({
        name: document.name,
        type: document.type.replaceAll("_", " "),
        date: dateLabel(document.updatedAt),
      })),
      outstandingPayment,
    };
  } catch (error) {
    console.error("[data-access] Failed to load client project:", error);
    throw error;
  }
}

export function getTrustStats() {
  return trustStats;
}

export function getHomeServices() {
  return homeServices;
}

export function getHomeProjects() {
  return homeProjects;
}

export function getReasons() {
  return reasons;
}

export function getHomeProcess() {
  return process;
}

export function getTestimonials() {
  return testimonials;
}

export function getServices() {
  return services;
}

export function getServiceBySlug(slug: string) {
  return getMockServiceBySlug(slug);
}

export function getProjects() {
  return projects;
}

export function getProjectBySlug(slug: string) {
  return getMockProjectBySlug(slug);
}

export function getProjectCategories() {
  return projectCategories;
}

export function getValues() {
  return values;
}

export function getExpertise() {
  return expertise;
}

export function getProcessSteps() {
  return processSteps;
}

export function getClientDashboardNavItems() {
  return clientNavFallback;
}

export function getClientDashboardStats() {
  return clientStatsFallback;
}

export function getClientDashboardProjects() {
  return clientProjectsFallback;
}

export function getClientDashboardActivity() {
  return clientActivityFallback;
}

export function getAdminNavItems() {
  return adminNavFallback;
}

export function getAdminStats() {
  return adminStatsFallback;
}

export function getAdminProjects() {
  return adminProjectsFallback;
}

export function getAdminLeads() {
  return adminLeadsFallback;
}

export function getAdminActivity() {
  return adminActivityFallback;
}
