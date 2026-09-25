"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminIcon } from "@/components/admin/admin-icons";

type StatToneKey = "neutral" | "positive" | "attention";

const statTone: Record<StatToneKey, string> = {
  neutral: "bg-white",
  positive: "bg-emerald-50",
  attention: "bg-amber-50",
};

type ProjectStatus = "All statuses" | "On track" | "At risk";

type Props = {
  navItems: { label: string; href: string; icon: string; count?: number }[];
  stats: { label: string; value: string; detail: string; tone: string }[];
  projects: { id: string; name: string; location: string; client: string; type: string; progress: number; status: string; updated: string }[];
  leads: { id: string; name: string; email: string; location: string; service: string; source: string; status: string; received: string }[];
  activity: { title: string; detail: string; icon: string }[];
  finance: { received: number; outstanding: number };
  reports: { quotedValue: number; convertedLeads: number; projectsByStatus: { status: string; count: number }[] };
  calendar: { id: string; title: string; date: string; isPast: boolean; status: string; projectId: string; projectName: string; clientName: string }[];
  customers: { id: string; name: string; email: string }[];
};

export function AdminDashboardClient({ navItems, stats, projects, leads, activity, finance, reports = { quotedValue: 0, convertedLeads: 0, projectsByStatus: [] }, calendar = [], customers }: Props) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>("All statuses");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [workflowMessage, setWorkflowMessage] = useState("");
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", customerId: "", leadId: "", location: "", description: "" });
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<{ id: string; name: string; location: string; progress: string; status: string } | null>(null);
  const [isFinanceFormOpen, setIsFinanceFormOpen] = useState<"quotation" | "payment" | null>(null);
  const [financeForm, setFinanceForm] = useState({ projectId: "", quotationNumber: "", subtotal: "", tax: "", amount: "", status: "pending", method: "bank_transfer" });
  const [convertingLead, setConvertingLead] = useState<Props["leads"][number] | null>(null);
  const [conversionForm, setConversionForm] = useState({ customerId: "", name: "", location: "", description: "" });
  const [pendingAction, setPendingAction] = useState("");

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesQuery =
        !normalizedQuery ||
        [project.name, project.client, project.type].some((v) => v.toLowerCase().includes(normalizedQuery));
      const matchesStatus = projectStatus === "All statuses" || project.status === projectStatus;
      return matchesQuery && matchesStatus;
    });
  }, [projects, projectStatus, query]);

  function handleRefresh() {
    setIsRefreshing(true);
    window.location.reload();
  }

  async function updateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProject) return;
    setPendingAction("project");
    try {
      const response = await fetch(`/api/admin/projects/${editingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingProject.name, location: editingProject.location, progress: Number(editingProject.progress), status: editingProject.status }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setWorkflowMessage(result.error || "Unable to update project.");
        return;
      }
      window.location.reload();
    } catch {
      setWorkflowMessage("Network error. Please try again.");
    } finally {
      setPendingAction("");
    }
  }

  async function submitFinance(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("finance");
    const endpoint = isFinanceFormOpen === "quotation" ? "/api/admin/quotations" : "/api/admin/payments";
    const payload = isFinanceFormOpen === "quotation"
      ? { projectId: financeForm.projectId, quotationNumber: financeForm.quotationNumber, subtotal: Number(financeForm.subtotal), tax: Number(financeForm.tax || 0) }
      : { projectId: financeForm.projectId, amount: Number(financeForm.amount), status: financeForm.status, method: financeForm.method };
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setWorkflowMessage(result.error || "Unable to save finance record.");
        return;
      }
      setIsFinanceFormOpen(null);
      setWorkflowMessage("Finance record saved.");
      window.location.reload();
    } catch {
      setWorkflowMessage("Network error. Please try again.");
    } finally {
      setPendingAction("");
    }
  }

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreatingProject(true);
    setWorkflowMessage("");
    const response = await fetch("/api/admin/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectForm),
    });
    const result = await response.json().catch(() => ({})) as { error?: string };
    setIsCreatingProject(false);
    if (!response.ok) {
      setWorkflowMessage(result.error || "Unable to create project.");
      return;
    }
    setWorkflowMessage("Project created successfully. Refreshing data...");
    setIsProjectFormOpen(false);
    setProjectForm({ name: "", customerId: "", leadId: "", location: "", description: "" });
    window.location.reload();
  }

  async function updateLeadStatus(id: string, status: "contacted" | "qualified") {
    setPendingAction(`lead-${id}`);
    try {
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        setWorkflowMessage(result.error || "Unable to update lead.");
        return;
      }
      setWorkflowMessage("Lead updated. Refreshing data...");
      window.location.reload();
    } catch {
      setWorkflowMessage("Network error. Please try again.");
    } finally {
      setPendingAction("");
    }
  }

  async function convertLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!convertingLead) return;
    setPendingAction("convert");
    try {
      const response = await fetch(`/api/admin/leads/${convertingLead.id}/convert`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(conversionForm) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) {
        setWorkflowMessage(result.error || "Unable to create project from lead.");
        return;
      }
      setConvertingLead(null);
      setWorkflowMessage("Lead converted and project created. Refreshing...");
      window.location.reload();
    } catch {
      setWorkflowMessage("Network error. Please try again.");
    } finally {
      setPendingAction("");
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-[#f0ede7]/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em]"
          >
            <span className="gold-gradient-bg flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-primary shadow-md shadow-[#c5a059]/20">B</span>
            Buildora
          </Link>
          <button
            type="button"
            aria-label="Toggle admin navigation"
            aria-expanded={isMobileNavOpen}
            onClick={() => setIsMobileNavOpen((open) => !open)}
            className="rounded-full border border-border bg-white p-2.5"
          >
            <AdminIcon name={isMobileNavOpen ? "file" : "grid"} className="h-5 w-5" />
          </button>
        </div>
        {isMobileNavOpen && (
          <nav aria-label="Mobile admin navigation" className="border-t border-border bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-col gap-1">
              {navItems.map((item, index) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${index === 0 ? "bg-primary text-white" : "text-muted hover:bg-background hover:text-primary"}`}
                >
                  <AdminIcon name={item.icon} className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.count && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                      {item.count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/25 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setEditingProject(null)}>
          <form onSubmit={updateProject} className="admin-modal w-full max-w-lg rounded-3xl border border-[#d9cba8] bg-[#fffdf8] p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="edit-project-title">
            <div className="flex justify-between"><h2 id="edit-project-title" className="text-2xl font-semibold">Edit project</h2><button type="button" onClick={() => setEditingProject(null)} className="text-sm text-muted transition-colors hover:text-primary">Close</button></div>
            <div className="mt-6 space-y-4">
              <input required value={editingProject.name} onChange={(event) => setEditingProject({ ...editingProject, name: event.target.value })} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" placeholder="Project name" />
              <input value={editingProject.location} onChange={(event) => setEditingProject({ ...editingProject, location: event.target.value })} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" placeholder="Location" />
              <input required type="number" min="0" max="100" value={editingProject.progress} onChange={(event) => setEditingProject({ ...editingProject, progress: event.target.value })} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" placeholder="Progress %" />
              <select value={editingProject.status} onChange={(event) => setEditingProject({ ...editingProject, status: event.target.value })} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"><option value="planning">Planning</option><option value="in_progress">In progress</option><option value="on_hold">On hold</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
            </div>
            <button disabled={pendingAction === "project"} className="mt-6 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#1d2731] disabled:opacity-60">{pendingAction === "project" ? "Saving..." : "Save changes"}</button>
          </form>
        </div>
      )}
      {isFinanceFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/25 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setIsFinanceFormOpen(null)}>
          <form onSubmit={submitFinance} className="admin-modal w-full max-w-lg rounded-3xl border border-[#d9cba8] bg-[#fffdf8] p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="finance-title">
            <div className="flex justify-between"><h2 id="finance-title" className="text-2xl font-semibold">{isFinanceFormOpen === "quotation" ? "Create quotation" : "Record payment"}</h2><button type="button" onClick={() => setIsFinanceFormOpen(null)} className="text-sm text-muted transition-colors hover:text-primary">Close</button></div>
            <div className="mt-6 space-y-4">
              <select required value={financeForm.projectId} onChange={(event) => setFinanceForm({ ...financeForm, projectId: event.target.value })} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"><option value="">Select project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
              {isFinanceFormOpen === "quotation" ? <><input required value={financeForm.quotationNumber} onChange={(event) => setFinanceForm({ ...financeForm, quotationNumber: event.target.value })} placeholder="Quotation number" className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" /><input required type="number" min="0" step="0.01" value={financeForm.subtotal} onChange={(event) => setFinanceForm({ ...financeForm, subtotal: event.target.value })} placeholder="Subtotal" className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" /><input type="number" min="0" step="0.01" value={financeForm.tax} onChange={(event) => setFinanceForm({ ...financeForm, tax: event.target.value })} placeholder="Tax" className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" /></> : <><input required type="number" min="0.01" step="0.01" value={financeForm.amount} onChange={(event) => setFinanceForm({ ...financeForm, amount: event.target.value })} placeholder="Amount" className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" /><select value={financeForm.status} onChange={(event) => setFinanceForm({ ...financeForm, status: event.target.value })} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"><option value="pending">Pending</option><option value="partially_paid">Partially paid</option><option value="paid">Paid</option><option value="overdue">Overdue</option></select><select value={financeForm.method} onChange={(event) => setFinanceForm({ ...financeForm, method: event.target.value })} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"><option value="bank_transfer">Bank transfer</option><option value="card">Card</option><option value="cash">Cash</option><option value="other">Other</option></select></>}
            </div>
            <button disabled={pendingAction === "finance"} className="mt-6 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#1d2731] disabled:opacity-60">{pendingAction === "finance" ? "Saving..." : "Save record"}</button>
          </form>
        </div>
      )}
      {convertingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/25 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setConvertingLead(null)}>
          <form onSubmit={convertLead} className="admin-modal w-full max-w-lg rounded-3xl border border-[#d9cba8] bg-[#fffdf8] p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="convert-lead-title">
            <div className="flex justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Lead conversion</p><h2 id="convert-lead-title" className="mt-2 text-2xl font-semibold">Create project from enquiry</h2></div><button type="button" onClick={() => setConvertingLead(null)} className="text-sm text-muted transition-colors hover:text-primary">Close</button></div>
            <p className="mt-3 text-sm text-muted">{convertingLead.name} · {convertingLead.email}</p>
            <div className="mt-6 space-y-4">
              <select required value={conversionForm.customerId} onChange={(event) => setConversionForm({ ...conversionForm, customerId: event.target.value })} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm"><option value="">Select client account</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.email}</option>)}</select>
              <input required value={conversionForm.name} onChange={(event) => setConversionForm({ ...conversionForm, name: event.target.value })} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" placeholder="Project name" />
              <input required value={conversionForm.location} onChange={(event) => setConversionForm({ ...conversionForm, location: event.target.value })} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" placeholder="Project location" />
              <textarea value={conversionForm.description} onChange={(event) => setConversionForm({ ...conversionForm, description: event.target.value })} className="min-h-24 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" placeholder="Internal project notes (optional)" />
            </div>
            <button disabled={pendingAction === "convert"} className="mt-6 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#1d2731] disabled:opacity-60">{pendingAction === "convert" ? "Creating..." : "Create and assign project"}</button>
          </form>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="flex flex-col justify-between gap-5 border-b border-border pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Operations overview</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tighter sm:text-4xl">Good morning, admin</h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              A concise view of the work that needs attention across Buildora.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {isRefreshing ? "Refreshing..." : "Refresh data"}
            </button>
            <button type="button" onClick={() => setIsProjectFormOpen(true)} className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#1d2731] hover:shadow-lg hover:shadow-primary/15">
              Add project
            </button>
            {isProjectFormOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/25 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setIsProjectFormOpen(false)}>
                <form onSubmit={createProject} className="admin-modal w-full max-w-lg rounded-3xl border border-[#d9cba8] bg-[#fffdf8] p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="create-project-title">
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Delivery pipeline</p><h2 id="create-project-title" className="mt-2 text-2xl font-semibold">Add project</h2></div>
                    <button type="button" onClick={() => setIsProjectFormOpen(false)} className="text-sm text-muted">Close</button>
                  </div>
                  <div className="mt-6 space-y-4">
                    <input required value={projectForm.name} onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))} placeholder="Project name" className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" />
                    <select required value={projectForm.customerId} onChange={(event) => setProjectForm((current) => ({ ...current, customerId: event.target.value }))} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm">
                      <option value="">Select client</option>
                      {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} — {customer.email}</option>)}
                    </select>
                    <select value={projectForm.leadId} onChange={(event) => setProjectForm((current) => ({ ...current, leadId: event.target.value }))} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm">
                      <option value="">Link an enquiry (optional)</option>
                      {leads.filter((lead) => lead.status !== "Converted").map((lead) => <option key={lead.id} value={lead.id}>{lead.name} · {lead.email}</option>)}
                    </select>
                    <input value={projectForm.location} onChange={(event) => setProjectForm((current) => ({ ...current, location: event.target.value }))} placeholder="Location" className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" />
                    <textarea value={projectForm.description} onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))} placeholder="Project description" rows={4} className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm" />
                  </div>
                  <button disabled={isCreatingProject} className="mt-6 w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{isCreatingProject ? "Creating..." : "Create project"}</button>
                </form>
              </div>
            )}
          </div>
        </div>

        <section aria-label="Business summary" className="grid gap-3 py-7 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className={`admin-hover-card admin-reveal rounded-2xl border border-border p-5 ${statTone[stat.tone as StatToneKey] ?? "bg-white"}`}
            >
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="mt-4 text-2xl font-semibold tracking-tight">{stat.value}</p>
              <p className="mt-2 text-xs font-medium text-muted">{stat.detail}</p>
            </article>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
          <section id="projects" className="admin-hover-card scroll-mt-6 rounded-2xl border border-border bg-white p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Delivery pipeline</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">Projects</h2>
              </div>
              <Link href="#projects" className="text-sm font-semibold underline underline-offset-4">
                View all projects
              </Link>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Search projects</span>
                <AdminIcon name="grid" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects, clients, or services"
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label>
                <span className="sr-only">Filter projects by status</span>
                <select
                  value={projectStatus}
                  onChange={(e) => setProjectStatus(e.target.value as ProjectStatus)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary sm:w-40"
                >
                  <option>All statuses</option>
                  <option>On track</option>
                  <option>At risk</option>
                </select>
              </label>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-[#d9cba8] bg-[#fffdf8] px-5 py-8 text-center">
                <p className="text-sm font-semibold text-primary">No projects found</p>
                <p className="mt-1 text-sm text-muted">Try a different search or status filter.</p>
                <button type="button" onClick={() => { setQuery(""); setProjectStatus("All statuses"); }} className="mt-4 rounded-full border border-border px-4 py-2 text-xs font-bold transition-colors hover:border-[#c5a059]">Clear filters</button>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[650px] text-left">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted">
                      <th className="pb-3 font-semibold">Project</th>
                      <th className="pb-3 font-semibold">Progress</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Updated</th>
                      <th className="pb-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="border-b border-border last:border-0">
                        <td className="py-4">
                          <p className="text-sm font-semibold">{project.name}</p>
                          <p className="mt-1 text-xs text-muted">
                            {project.client} · {project.type}
                          </p>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-background">
                              <div
                                className="h-full rounded-full bg-amber-500"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold">{project.progress}%</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${project.status === "At risk" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                          >
                            {project.status}
                          </span>
                        </td>
                        <td className="py-4 text-xs text-muted">{project.updated}</td>
                        <td className="py-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button type="button" onClick={() => setEditingProject({ id: project.id, name: project.name, location: project.location, progress: String(project.progress), status: project.status === "On track" ? "in_progress" : "on_hold" })} className="text-xs font-bold underline underline-offset-4">Edit</button>
                          <Link href={`/client/projects/${project.id}`} className="text-xs font-bold underline underline-offset-4">Open</Link>
                        </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section id="payments" className="admin-hover-card rounded-2xl border border-border bg-primary p-5 text-white sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Finance snapshot</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Revenue</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Connect payment reporting when the finance workflow is ready.
            </p>
            <div className="mt-8 border-t border-white/15 pt-5">
              <p className="text-3xl font-semibold">₹{finance.received.toLocaleString("en-IN")}</p>
              <p className="mt-2 text-xs text-white/55">₹{finance.outstanding.toLocaleString("en-IN")} outstanding across active records.</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={() => setIsFinanceFormOpen("quotation")} className="rounded-full border border-white/25 px-4 py-2.5 text-sm font-semibold text-white/80 transition-all hover:-translate-y-0.5 hover:border-[#d4af37] hover:text-white">New quotation</button>
              <button type="button" onClick={() => setIsFinanceFormOpen("payment")} className="rounded-full border border-white/25 px-4 py-2.5 text-sm font-semibold text-white/80 transition-all hover:-translate-y-0.5 hover:border-[#d4af37] hover:text-white">Record payment</button>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
          <section id="leads" className="admin-hover-card scroll-mt-6 rounded-2xl border border-border bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Business development</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">New leads</h2>
                {workflowMessage && <p className="mt-1 text-xs font-semibold text-[#a98032]" role="status">{workflowMessage}</p>}
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                {leads.length} total
              </span>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[540px] text-left">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-[0.12em] text-muted">
                    <th className="pb-3 font-semibold">Lead</th>
                    <th className="pb-3 font-semibold">Service</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-sm text-muted">
                        No leads yet.
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-border last:border-0">
                        <td className="py-4">
                          <p className="text-sm font-semibold">{lead.name}</p>
                          <p className="mt-1 text-xs text-muted">{lead.email} · {lead.location}</p>
                          <p className="mt-1 text-xs text-muted">
                            {lead.source} · {lead.received}
                          </p>
                        </td>
                        <td className="py-4 text-xs text-muted">{lead.service}</td>
                        <td className="py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${lead.status === "New" ? "bg-amber-100 text-amber-800" : "bg-background text-muted"}`}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-3">
                            {lead.status !== "Converted" && lead.status !== "Closed" && <button type="button" disabled={pendingAction === `lead-${lead.id}`} onClick={() => updateLeadStatus(lead.id, lead.status === "New" ? "contacted" : "qualified")} className="text-xs font-bold underline underline-offset-4 disabled:opacity-50">{pendingAction === `lead-${lead.id}` ? "Saving..." : lead.status === "New" ? "Contact" : "Qualify"}</button>}
                            {lead.status !== "Converted" && <button type="button" onClick={() => { setConvertingLead(lead); setConversionForm({ customerId: customers.find((customer) => customer.email.toLowerCase() === lead.email.toLowerCase())?.id || "", name: `${lead.name}'s project`, location: lead.location, description: "" }); }} className="text-xs font-bold text-[#a98032] underline underline-offset-4">Create project</button>}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Work queue</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">Recent activity</h2>
              </div>
              <Link href="#notifications" className="text-sm font-semibold underline underline-offset-4">
                View all
              </Link>
            </div>
            <div className="mt-5 divide-y divide-border">
              {activity.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">No recent activity.</p>
              ) : (
                activity.map((item) => (
                  <div key={`${item.title}-${item.detail}`} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted">
                      <AdminIcon name={item.icon} className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs text-muted">{item.detail}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section id="reports" className="mt-6 scroll-mt-6 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Reports</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Reporting workspace</h2>
              <p className="mt-2 text-sm text-muted">
                Live operational and financial reporting from your Buildora records.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
              <div className="rounded-2xl border border-border bg-[#fffdf8] p-4">
                <p className="text-xs text-muted">Quoted value</p>
                <p className="mt-2 text-xl font-semibold">₹{reports.quotedValue.toLocaleString("en-IN")}</p>
              </div>
              <div className="rounded-2xl border border-border bg-[#fffdf8] p-4">
                <p className="text-xs text-muted">Converted leads</p>
                <p className="mt-2 text-xl font-semibold">{reports.convertedLeads}</p>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {reports.projectsByStatus.map((item) => (
              <div key={item.status} className="rounded-2xl border border-border p-4">
                <p className="text-xs capitalize text-muted">{item.status.replaceAll("_", " ")}</p>
                <p className="mt-2 text-2xl font-semibold">{item.count}</p>
                <p className="mt-1 text-xs text-muted">projects</p>
              </div>
            ))}
            {!reports.projectsByStatus.length && <p className="text-sm text-muted">No project records are available yet.</p>}
          </div>
        </section>

        <section id="calendar" className="admin-hover-card mt-6 scroll-mt-6 rounded-2xl border border-border bg-white p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Operations planning</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Project calendar</h2>
              <p className="mt-2 text-sm text-muted">Upcoming milestones and deadlines across your active projects.</p>
            </div>
            <span className="rounded-full bg-[#f3efe5] px-3 py-1.5 text-xs font-bold text-[#8d6c2b]">{calendar.length} upcoming</span>
          </div>
          {calendar.length ? (
            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {calendar.map((item) => {
                const date = new Date(item.date);
                const isPast = item.isPast;
                return (
                  <Link key={item.id} href={`/client/projects/${item.projectId}`} className="admin-hover-card group rounded-2xl border border-border bg-[#fffdf8] p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl ${isPast ? "bg-red-50 text-red-700" : "bg-[#f3efe5] text-[#8d6c2b]"}`}>
                        <span className="text-[10px] font-bold uppercase">{date.toLocaleDateString("en-IN", { month: "short" })}</span>
                        <span className="text-lg font-semibold leading-5">{date.getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold group-hover:text-[#8d6c2b]">{item.title}</p>
                        <p className="mt-1 truncate text-xs text-muted">{item.projectName} · {item.clientName}</p>
                        <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-[10px] font-bold capitalize ${isPast ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{isPast ? "Due" : item.status.replaceAll("_", " ")}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-[#d9cba8] bg-[#fffdf8] px-5 py-8 text-center">
              <p className="text-sm font-semibold">No milestones scheduled</p>
              <p className="mt-1 text-sm text-muted">Add dates to project milestones to plan your delivery calendar.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
