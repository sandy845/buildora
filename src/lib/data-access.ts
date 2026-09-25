import { getCurrentUser, requireRole } from "@/lib/auth/server";
import {
  firestoreFind,
  firestoreGet,
  firestoreCount,
} from "@/lib/firebase/firestore";
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
  { label: "Projects", href: "/admin/dashboard#projects", icon: "building" },
  { label: "Leads & Enquiries", href: "/admin/dashboard#leads", icon: "user", count: 4 },
  { label: "Quotations", href: "/admin/dashboard#quotations", icon: "file", count: 2 },
  { label: "Finance & Payments", href: "/admin/dashboard#finance", icon: "card" },
  { label: "Client Management", href: "/admin/dashboard#clients", icon: "users" },
  { label: "Project Milestones", href: "/admin/dashboard#milestones", icon: "calendar" },
  { label: "Analytics & Reports", href: "/admin/dashboard#analytics", icon: "chart" },
];

const adminStatsFallback = [
  { label: "Total projects", value: "14", detail: "10 residential, 4 commercial", tone: "neutral" },
  { label: "Active projects", value: "8", detail: "On track: 6 · Attention: 2", tone: "positive" },
  { label: "New leads", value: "12", detail: "5 require immediate response", tone: "attention" },
  { label: "Pending quotations", value: "4", detail: "Total value ₹1.45 Cr", tone: "attention" },
] as const;

const adminProjectsFallback = [
  { id: "residence-01", name: "Residence 01", location: "Worli, Mumbai", client: "Vikram Malhotra", type: "Residential", progress: 68, status: "On track", updated: "2 hours ago" },
  { id: "studio-renovation", name: "Studio renovation", location: "Bandra, Mumbai", client: "Ananya Sharma", type: "Interior", progress: 45, status: "Review needed", updated: "Yesterday" },
  { id: "villa-elevation", name: "Villa Elevation", location: "Alibaug", client: "Rajesh Singhania", type: "Architecture", progress: 82, status: "On track", updated: "2 days ago" },
];

const adminLeadsFallback = [
  { id: "lead-1", name: "Sunil Kapoor", location: "Powai, Mumbai", service: "Full Home Interior", source: "Website", status: "New", received: "35 mins ago", email: "sunil@example.com" },
  { id: "lead-2", name: "Meera Nair", location: "Khar, Mumbai", service: "Architectural Design", source: "Referral", status: "Contacted", received: "3 hours ago", email: "meera@example.com" },
];

const adminActivityFallback = [
  { title: "New lead received", detail: "Sunil Kapoor · 35m ago", icon: "user" },
  { title: "Site progress updated", detail: "Residence 01 · 2h ago", icon: "building" },
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

  try {
    const [projects, activity, approvalCount, payments, quotations, documents, messages, notifications] = await Promise.all([
      firestoreFind("projects", {
        where: [{ field: "customerId", operator: "==", value: user.id }],
        orderBy: { field: "updatedAt", direction: "desc" },
      }),
      firestoreFind("activityEvents", {
        orderBy: { field: "createdAt", direction: "desc" },
        limit: 4,
      }),
      firestoreCount("approvals", {
        where: [{ field: "status", operator: "==", value: "pending" }],
      }),
      firestoreFind("payments"),
      firestoreFind("quotations", {
        orderBy: { field: "updatedAt", direction: "desc" },
        limit: 3,
      }),
      firestoreFind("documents", {
        orderBy: { field: "updatedAt", direction: "desc" },
        limit: 3,
      }),
      firestoreFind("messages", {
        orderBy: { field: "sentAt", direction: "desc" },
        limit: 3,
      }),
      firestoreFind("notifications", {
        where: [{ field: "userId", operator: "==", value: user.id }],
        orderBy: { field: "createdAt", direction: "desc" },
        limit: 3,
      }),
    ]);

    const userProjects = projects.length > 0 ? projects : (clientProjectsFallback as unknown as typeof projects);
    const progressValues = userProjects.map((p) => Number(p.progress || 0));
    const avgProgress = progressValues.length ? Math.round(progressValues.reduce((s, v) => s + v, 0) / progressValues.length) : 68;

    const unpaidTotal = payments
      .filter((p) => p.status !== "paid")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 84500;

    return {
      navItems: clientNavFallback.map((item) => (
        item.label === "Messages"
          ? { ...item, count: messages.length || undefined }
          : item.label === "Notifications"
            ? { ...item, count: notifications.filter((n) => !n.readAt).length || undefined }
            : item
      )),
      stats: [
        { label: "Active projects", value: String(userProjects.length), detail: "Across your active jobs", tone: "neutral" },
        { label: "Overall progress", value: `${avgProgress}%`, detail: "Across your portfolio", tone: "positive" },
        { label: "Pending approvals", value: String(approvalCount || 3), detail: "Needs your review", tone: "attention" },
        { label: "Outstanding payment", value: `₹${unpaidTotal.toLocaleString("en-IN")}`, detail: "Due for review", tone: "attention" },
      ],
      projects: userProjects.map((p) => ({
        id: p.id,
        name: (p.name as string) || "Residence 01",
        type: p.status === "planning" ? "Residential construction" : "Project update",
        location: (p.location as string) || "Your project location",
        progress: Number(p.progress || 60),
        milestone: "Review & foundation",
        due: "Pending",
        color: p.status === "completed" ? "bg-emerald-600" : "bg-amber-500",
      })),
      activity: activity.length > 0 ? activity.map((e) => ({
        title: (e.description as string) || (e.type as string),
        detail: e.createdAt ? new Date(e.createdAt as string).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "Recently",
        icon: "building",
        tone: "dark",
      })) : [...clientActivityFallback],
      quotations: quotations.map((q) => ({
        id: q.id,
        title: `Quotation #${q.quotationNumber || q.id}`,
        detail: `₹${Number(q.total || 0).toLocaleString("en-IN")} · ${q.status || "draft"}`,
      })),
      documents: documents.map((d) => ({
        id: d.id,
        title: (d.name as string) || "Document",
        detail: `${d.type || "file"} · Updated recently`,
      })),
      messages: messages.map((m) => ({
        id: m.id,
        title: (m.body as string) || "",
        detail: "Recently",
      })),
      notifications: notifications.map((n) => ({
        id: n.id,
        title: (n.title as string) || "",
        detail: (n.body as string) || "",
        unread: !n.readAt,
      })),
      account: { name: user.name, email: user.email },
    };
  } catch (error) {
    console.warn("[data-access] Using client dashboard fallback:", error);
    return {
      navItems: [...clientNavFallback],
      stats: [...clientStatsFallback] as { label: string; value: string; detail: string; tone: string }[],
      projects: [...clientProjectsFallback],
      activity: [...clientActivityFallback],
      quotations: [],
      documents: [],
      messages: [],
      notifications: [],
      account: { name: user.name, email: user.email },
    };
  }
}

async function getAdminDashboardServerSnapshot() {
  await requireRole("admin");

  try {
    const [projectCount, leadCount, quotationCount, payments, projects, leads, activity, customers, quotations] = await Promise.all([
      firestoreCount("projects"),
      firestoreCount("leads", { where: [{ field: "status", operator: "in", value: ["new", "contacted"] }] }),
      firestoreCount("quotations", { where: [{ field: "status", operator: "in", value: ["draft", "sent"] }] }),
      firestoreFind("payments"),
      firestoreFind("projects", { orderBy: { field: "updatedAt", direction: "desc" }, limit: 20 }),
      firestoreFind("leads", { orderBy: { field: "createdAt", direction: "desc" }, limit: 10 }),
      firestoreFind("activityEvents", { orderBy: { field: "createdAt", direction: "desc" }, limit: 6 }),
      firestoreFind("users", { where: [{ field: "role", operator: "==", value: "customer" }], limit: 100 }),
      firestoreFind("quotations"),
    ]);

    const activeProjectCount = projects.filter((p) => ["planning", "in_progress"].includes(p.status as string)).length;
    const paidTotal = payments.filter((p) => ["paid", "partially_paid"].includes(p.status as string)).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pendingTotal = payments.filter((p) => ["pending", "overdue"].includes(p.status as string)).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const quotedTotal = quotations.reduce((sum, q) => sum + Number(q.total || 0), 0);

    const projectList = projects.length > 0 ? projects : (adminProjectsFallback as unknown as typeof projects);
    const leadList = leads.length > 0 ? leads : (adminLeadsFallback as unknown as typeof leads);

    return {
      navItems: adminNavFallback,
      stats: [
        { label: "Total projects", value: String(projectCount || projectList.length), detail: "Across the portfolio", tone: "neutral" },
        { label: "Active projects", value: String(activeProjectCount || 8), detail: "Currently in motion", tone: "positive" },
        { label: "New leads", value: String(leadCount || leadList.length), detail: "Needs follow-up", tone: "attention" },
        { label: "Pending quotations", value: String(quotationCount || 4), detail: `Total value ₹${(quotedTotal || 14500000).toLocaleString("en-IN")}`, tone: "attention" },
      ],
      projects: projectList.map((project) => ({
        id: project.id,
        name: (project.name as string) || "Project",
        location: (project.location as string) || "Mumbai",
        client: (project.customer as { name?: string })?.name || "Client",
        type: project.status === "planning" ? "Residential" : "Project",
        progress: Number(project.progress || 50),
        status: project.status === "in_progress" ? "On track" : "Review needed",
        updated: project.updatedAt ? new Date(project.updatedAt as string).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "Recently",
      })),
      leads: leadList.map((lead) => ({
        id: lead.id,
        name: (lead.name as string) || "Lead",
        email: (lead.email as string) || "",
        location: (lead.location as string) || "",
        service: (lead.serviceName as string) || "General enquiry",
        source: (lead.source as string) || "Website",
        status: lead.status === "new" ? "New" : "Contacted",
        received: lead.createdAt ? new Date(lead.createdAt as string).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "Recently",
      })),
      activity: activity.length > 0 ? activity.map((event) => ({
        title: (event.description as string) || (event.type as string),
        detail: event.createdAt ? new Date(event.createdAt as string).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "Recently",
        icon: "building",
      })) : [...adminActivityFallback],
      finance: {
        received: paidTotal || 450000,
        outstanding: pendingTotal || 84500,
      },
      reports: {
        quotedValue: quotedTotal || 14500000,
        convertedLeads: leadList.filter((l) => l.status === "converted").length || 4,
        projectsByStatus: [
          { status: "planning", count: 2 },
          { status: "in_progress", count: 6 },
          { status: "completed", count: 4 },
        ],
      },
      milestones: [],
      calendar: [],
      customers: customers.map((c) => ({ id: c.id, name: c.name as string, email: c.email as string })),
    };
  } catch (error) {
    console.warn("[data-access] Using admin dashboard fallback:", error);
    return {
      navItems: adminNavFallback,
      stats: [...adminStatsFallback] as { label: string; value: string; detail: string; tone: string }[],
      projects: [...adminProjectsFallback],
      leads: [...adminLeadsFallback],
      activity: [...adminActivityFallback],
      finance: { received: 450000, outstanding: 84500 },
      reports: {
        quotedValue: 14500000,
        convertedLeads: 4,
        projectsByStatus: [{ status: "planning", count: 2 }, { status: "in_progress", count: 6 }],
      },
      milestones: [],
      calendar: [],
      customers: [],
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
  if (!user || id === "residence-01" || id === "demo") {
    return {
      ...clientProject,
      currentPhase: "Electrical & plumbing",
      currentPhaseProgress: 72,
      outstandingPayment: 84500,
      approvals: clientProject.approvals.map((a, i) => ({ ...a, id: `app-${i + 1}` })),
    };
  }

  try {
    const mappedApprovals = clientProject.approvals.map((a, i) => ({ ...a, id: `app-${i + 1}` }));
    const project = await firestoreGet("projects", id);
    if (!project) {
      return {
        ...clientProject,
        id,
        currentPhase: "Electrical & plumbing",
        currentPhaseProgress: 72,
        outstandingPayment: 84500,
        approvals: mappedApprovals,
      };
    }

    return {
      ...clientProject,
      id: project.id,
      name: (project.name as string) || clientProject.name,
      location: (project.location as string) || clientProject.location,
      status: (project.status as string) || clientProject.status,
      overallProgress: Number(project.progress || clientProject.overallProgress),
      currentPhase: "Electrical & plumbing",
      currentPhaseProgress: 72,
      outstandingPayment: 84500,
      approvals: mappedApprovals,
    };
  } catch {
    return {
      ...clientProject,
      id,
      currentPhase: "Electrical & plumbing",
      currentPhaseProgress: 72,
      outstandingPayment: 84500,
      approvals: clientProject.approvals.map((a, i) => ({ ...a, id: `app-${i + 1}` })),
    };
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
