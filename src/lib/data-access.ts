import { getCurrentUser, requireRole } from "@/lib/auth/server";
import { prisma } from "@/lib/db/prisma";
import { clientProject } from "@/data/client-project";
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
  { label: "Active projects", value: "2", detail: "Across 2 locations", tone: "neutral" },
  { label: "Overall progress", value: "68%", detail: "+8% this month", tone: "positive" },
  { label: "Pending approvals", value: "3", detail: "Needs your review", tone: "attention" },
  { label: "Outstanding payment", value: "₹84,500", detail: "Due 18 Sep 2026", tone: "attention" },
] as const;

const clientProjectsFallback = [
  {
    id: "residence-01",
    name: "Residence 01",
    type: "Residential construction",
    location: "Your project location",
    progress: 72,
    milestone: "Electrical & plumbing",
    due: "Due 24 Sep",
    color: "bg-amber-500",
  },
  {
    id: "studio-renovation",
    name: "Studio renovation",
    type: "Interior renovation",
    location: "Your project location",
    progress: 64,
    milestone: "Cabinet installation",
    due: "Due 02 Oct",
    color: "bg-emerald-600",
  },
];

const clientActivityFallback = [
  { title: "Site progress updated", detail: "Residence 01 · 2 hours ago", icon: "building", tone: "dark" },
  { title: "Quotation ready for review", detail: "Studio renovation · Yesterday", icon: "file", tone: "gold" },
  { title: "Payment milestone recorded", detail: "Residence 01 · 2 days ago", icon: "card", tone: "green" },
  { title: "New document uploaded", detail: "Studio renovation · 4 days ago", icon: "folder", tone: "slate" },
];

const adminNavFallback = [
  { label: "Overview", href: "/admin/dashboard", icon: "grid" },
  { label: "Users", href: "/admin/dashboard#users", icon: "users" },
  { label: "Leads", href: "/admin/dashboard#leads", icon: "target", count: 8 },
  { label: "Projects", href: "/admin/dashboard#projects", icon: "building" },
  { label: "Services", href: "/admin/dashboard#services", icon: "layers" },
  { label: "Portfolio", href: "/admin/dashboard#portfolio", icon: "image" },
  { label: "Quotations", href: "/admin/dashboard#quotations", icon: "file", count: 5 },
  { label: "Payments", href: "/admin/dashboard#payments", icon: "card" },
  { label: "Documents", href: "/admin/dashboard#documents", icon: "folder" },
  { label: "Reports", href: "/admin/dashboard#reports", icon: "chart" },
  { label: "Settings", href: "/admin/dashboard#settings", icon: "settings" },
];

const adminStatsFallback = [
  { label: "Total projects", value: "24", detail: "+3 this quarter", tone: "neutral" },
  { label: "Active projects", value: "12", detail: "8 on track · 4 at risk", tone: "positive" },
  { label: "New leads", value: "18", detail: "Since last week", tone: "attention" },
  { label: "Pending quotations", value: "5", detail: "Awaiting follow-up", tone: "attention" },
];

const adminProjectsFallback = [
  { name: "Residence 01", client: "Customer A", type: "Residential", progress: 72, status: "On track", updated: "Today" },
  { name: "Studio renovation", client: "Customer B", type: "Interior", progress: 64, status: "On track", updated: "Yesterday" },
  { name: "Courtyard build", client: "Customer C", type: "RCC", progress: 41, status: "At risk", updated: "2 days ago" },
  { name: "Office fit-out", client: "Customer D", type: "Commercial", progress: 88, status: "On track", updated: "4 days ago" },
];

const adminLeadsFallback = [
  { name: "Prospective customer A", service: "Residential construction", source: "Website", status: "New", received: "Today" },
  { name: "Prospective customer B", service: "Interior design", source: "Referral", status: "Contacted", received: "Yesterday" },
  { name: "Prospective customer C", service: "Renovation", source: "Website", status: "New", received: "2 days ago" },
];

const adminActivityFallback = [
  { title: "New lead received", detail: "Residential construction · 18 min ago", icon: "target" },
  { title: "Quotation approved", detail: "Studio renovation · 1 hour ago", icon: "file" },
  { title: "Project status updated", detail: "Residence 01 · 3 hours ago", icon: "building" },
  { title: "Payment recorded", detail: "Office fit-out · Yesterday", icon: "card" },
];

async function getClientDashboardServerSnapshot() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      navItems: [...clientNavFallback],
      stats: [...clientStatsFallback] as { label: string; value: string; detail: string; tone: string }[],
      projects: [...clientProjectsFallback],
      activity: [...clientActivityFallback],
      quotations: [],
      documents: [],
      messages: [],
      notifications: [],
      account: null,
    };
  }

  const [projects, activity, approvalCount, unpaidPayments, quotations, documents, messages, notifications] = await Promise.all([
    prisma.project.findMany({
      where: { customerId: user.id, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        location: true,
        status: true,
        progress: true,
        milestones: {
          orderBy: { dueDate: "asc" },
          take: 1,
          select: { name: true, dueDate: true },
        },
      },
    }),
    prisma.activityEvent.findMany({
      where: {
        project: { customerId: user.id },
        createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { type: true, description: true, createdAt: true },
    }),
    prisma.approval.count({
      where: {
        project: { customerId: user.id },
        status: "pending",
      },
    }),
    prisma.payment.aggregate({
      where: { project: { customerId: user.id }, status: { not: "paid" } },
      _sum: { amount: true },
    }),
    prisma.quotation.findMany({
      where: { project: { customerId: user.id }, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, quotationNumber: true, status: true, total: true },
    }),
    prisma.document.findMany({
      where: { project: { customerId: user.id }, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: { id: true, name: true, type: true, updatedAt: true },
    }),
    prisma.message.findMany({
      where: { conversation: { project: { customerId: user.id } }, deletedAt: null },
      orderBy: { sentAt: "desc" },
      take: 3,
      select: { id: true, body: true, sentAt: true },
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, body: true, readAt: true },
    }),
  ]);

  const progressValues = projects.map((project) => Number(project.progress));
  const avgProgress = progressValues.length ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : 0;

  return {
    navItems: clientNavFallback,
    stats: [
      { label: "Active projects", value: String(projects.length), detail: projects.length ? "Across your active jobs" : "No active projects", tone: "neutral" },
      { label: "Overall progress", value: `${avgProgress}%`, detail: projects.length ? "Across your portfolio" : "No progress yet", tone: "positive" },
      { label: "Pending approvals", value: String(approvalCount), detail: approvalCount ? "Needs your review" : "Nothing pending", tone: "attention" },
      { label: "Outstanding payment", value: `₹${Number(unpaidPayments._sum.amount ?? 0).toLocaleString("en-IN")}`, detail: Number(unpaidPayments._sum.amount ?? 0) ? "Due for review" : "No outstanding payment", tone: "attention" },
    ],
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      type: project.status === "planning" ? "Residential construction" : "Project update",
      location: project.location ?? "Your project location",
      progress: Number(project.progress),
      milestone: project.milestones[0]?.name ?? "Project review",
      due: project.milestones[0]?.dueDate ? new Date(project.milestones[0].dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "Pending",
      color: project.status === "completed" ? "bg-emerald-600" : "bg-amber-500",
    })),
    activity: activity.map((event) => ({
      title: event.description ?? event.type,
      detail: `${new Date(event.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`,
      icon: "building",
      tone: "dark",
    })),
    quotations: quotations.map((quotation) => ({
      id: quotation.id,
      title: `Quotation #${quotation.quotationNumber}`,
      detail: `₹${Number(quotation.total).toLocaleString("en-IN")} · ${quotation.status}`,
    })),
    documents: documents.map((document) => ({
      id: document.id,
      title: document.name,
      detail: `${document.type} · ${new Date(document.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`,
    })),
    messages: messages.map((message) => ({
      id: message.id,
      title: message.body,
      detail: new Date(message.sentAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    })),
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      detail: notification.body,
      unread: !notification.readAt,
    })),
    account: { name: user.name, email: user.email },
  };
}

async function getAdminDashboardServerSnapshot() {
  await requireRole("admin");

  const [projectCount, activeProjects, leadCount, quotationCount, projects, leads, activity] = await Promise.all([
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.project.count({ where: { deletedAt: null, status: { in: ["planning", "in_progress"] } } }),
    prisma.lead.count({ where: { deletedAt: null, status: { in: ["new", "contacted"] } } }),
    prisma.quotation.count({ where: { deletedAt: null, status: { in: ["draft", "sent"] } } }),
    prisma.project.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        name: true,
        status: true,
        progress: true,
        customer: { select: { name: true } },
        updatedAt: true,
      },
    }),
    prisma.lead.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { name: true, source: true, status: true, createdAt: true, service: { select: { name: true } } },
    }),
    prisma.activityEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { type: true, description: true, createdAt: true },
    }),
  ]);

  return {
    navItems: adminNavFallback,
    stats: [
      { label: "Total projects", value: String(projectCount), detail: "Across the portfolio", tone: "neutral" },
      { label: "Active projects", value: String(activeProjects), detail: "Currently in motion", tone: "positive" },
      { label: "New leads", value: String(leadCount), detail: "Needs follow-up", tone: "attention" },
      { label: "Pending quotations", value: String(quotationCount), detail: "Awaiting follow-up", tone: "attention" },
    ],
    projects: projects.map((project) => ({
      name: project.name,
      client: project.customer?.name ?? "Unknown client",
      type: project.status === "planning" ? "Residential" : "Project",
      progress: Number(project.progress),
      status: project.status === "in_progress" ? "On track" : "At risk",
      updated: new Date(project.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    })),
    leads: leads.map((lead) => ({
      name: lead.name,
      service: lead.service?.name ?? "General enquiry",
      source: lead.source,
      status: lead.status === "new" ? "New" : "Contacted",
      received: new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    })),
    activity: activity.map((event) => ({
      title: event.description ?? event.type,
      detail: `${new Date(event.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`,
      icon: "building",
    })),
  };
}

export async function getClientDashboardDataServer() {
  return getClientDashboardServerSnapshot();
}

export async function getAdminDashboardDataServer() {
  return getAdminDashboardServerSnapshot();
}

export async function getClientProjectById(id: string) {
  const user = await getCurrentUser();
  if (!user) {
    if (id === "residence-01" || id === "demo") {
      return {
        ...clientProject,
        currentPhase: "Electrical & plumbing",
        currentPhaseProgress: 72,
        outstandingPayment: 84500,
        approvals: clientProject.approvals.map((a, i) => ({ ...a, id: `app-${i + 1}` })),
      };
    }
    return null;
  }

  const project = await prisma.project.findFirst({
    where: { id, customerId: user.id, deletedAt: null },
    select: {
      id: true,
      name: true,
      location: true,
      status: true,
      progress: true,
      startDate: true,
      targetCompletionDate: true,
      description: true,
      phases: {
        orderBy: { sortOrder: "asc" },
        select: { name: true, status: true, progress: true },
      },
      milestones: {
        orderBy: { dueDate: "asc" },
        take: 8,
        select: { name: true, status: true, dueDate: true, description: true },
      },
      approvals: {
        where: { status: "pending" },
        orderBy: { createdAt: "asc" },
        take: 5,
        select: {
          id: true,
          targetType: true,
          createdAt: true,
          document: { select: { name: true } },
          designAsset: { select: { name: true } },
          milestone: { select: { name: true } },
          quotation: { select: { quotationNumber: true } },
        },
      },
      designs: {
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { name: true, type: true, updatedAt: true },
      },
      documents: {
        where: { deletedAt: null },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: { name: true, type: true, updatedAt: true },
      },
      payments: {
        where: { status: { not: "paid" } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { amount: true, status: true },
      },
      projectMaterials: {
        orderBy: { createdAt: "asc" },
        take: 5,
        select: {
          material: { select: { name: true, supplier: true } },
          approvals: { where: { status: "approved" }, select: { id: true } },
        },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { type: true, description: true, createdAt: true },
      },
    },
  });

  if (!project) return null;

  const fmt = (d: Date | string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Pending";

  const phaseStates = project.phases.map((phase) => ({
    name: phase.name,
    state:
      phase.status === "completed"
        ? ("complete" as const)
        : phase.status === "active"
          ? ("current" as const)
          : ("upcoming" as const),
    progress: Number(phase.progress),
  }));

  const timeline = project.activities.map((event) => ({
    title: event.description ?? event.type,
    date: fmt(event.createdAt),
    detail: event.description ?? "",
    state: "past" as const,
  }));

  const approvals = project.approvals.map((a) => ({
    id: a.id,
    title:
      a.document?.name ??
      a.designAsset?.name ??
      a.milestone?.name ??
      (a.quotation ? `Quotation ${a.quotation.quotationNumber}` : `${a.targetType} approval`),
    detail: a.targetType,
    due: fmt(a.createdAt),
  }));

  const designs = project.designs.map((d) => ({
    name: d.name,
    type: d.type,
    status: "Pending" as const,
  }));

  const materials = project.projectMaterials.map((pm) => ({
    name: pm.material.name,
    supplier: pm.material.supplier ?? "Unknown supplier",
    status: pm.approvals.length > 0 ? ("Approved" as const) : ("Pending" as const),
  }));

  const documents = project.documents.map((doc) => ({
    name: doc.name,
    type: doc.type,
    date: fmt(doc.updatedAt),
  }));

  const unpaidTotal = project.payments.reduce((sum, p) => sum + Number(p.amount), 0);

  const currentPhase = project.phases.find((p) => p.status === "active");
  const nextMilestone = project.milestones[0];

  return {
    id: project.id,
    name: project.name,
    type:
      project.status === "planning"
        ? "Residential construction"
        : project.status === "in_progress"
          ? "Active project"
          : "Project",
    location: project.location ?? "Your project location",
    status: project.status === "in_progress" ? "In progress" : project.status === "completed" ? "Completed" : "Planning",
    overallProgress: Number(project.progress),
    startDate: fmt(project.startDate),
    targetDate: fmt(project.targetCompletionDate),
    currentPhase: currentPhase?.name ?? "Project setup",
    currentPhaseProgress: currentPhase ? Number(currentPhase.progress) : 0,
    nextAction: nextMilestone
      ? {
          title: nextMilestone.name,
          description: nextMilestone.description ?? "Review and confirm the upcoming milestone with your project team.",
          due: `Due ${fmt(nextMilestone.dueDate)}`,
        }
      : {
          title: "No upcoming action",
          description: "Your project team will update you when there is something to review.",
          due: "",
        },
    phases: phaseStates,
    timeline,
    approvals,
    designs,
    materials,
    documents,
    outstandingPayment: unpaidTotal,
  };
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

export function getClientProject() {
  return clientProject;
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
