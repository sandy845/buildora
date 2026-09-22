"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminIcon } from "@/components/admin/admin-icons";
import { DashboardState } from "@/components/client/dashboard-state";

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
  projects: { name: string; client: string; type: string; progress: number; status: string; updated: string }[];
  leads: { name: string; service: string; source: string; status: string; received: string }[];
  activity: { title: string; detail: string; icon: string }[];
};

export function AdminDashboardClient({ navItems, stats, projects, leads, activity }: Props) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>("All statuses");
  const [isRefreshing, setIsRefreshing] = useState(false);

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
            <button type="button" className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white">
              Add project
            </button>
          </div>
        </div>

        <section aria-label="Business summary" className="grid gap-3 py-7 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className={`rounded-2xl border border-border p-5 ${statTone[stat.tone as StatToneKey] ?? "bg-white"}`}
            >
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="mt-4 text-2xl font-semibold tracking-tight">{stat.value}</p>
              <p className="mt-2 text-xs font-medium text-muted">{stat.detail}</p>
            </article>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
          <section id="projects" className="scroll-mt-6 rounded-2xl border border-border bg-white p-5 sm:p-6">
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
              <div className="mt-6">
                <DashboardState
                  type="empty"
                  title="No projects found"
                  description="Try a different search or status filter."
                  action="Clear filters"
                />
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
                      <tr key={project.name} className="border-b border-border last:border-0">
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
                          <button type="button" className="text-xs font-bold underline underline-offset-4">
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section id="payments" className="rounded-2xl border border-border bg-primary p-5 text-white sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Finance snapshot</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Revenue</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">
              Connect payment reporting when the finance workflow is ready.
            </p>
            <div className="mt-8 border-t border-white/15 pt-5">
              <p className="text-3xl font-semibold">--</p>
              <p className="mt-2 text-xs text-white/55">Revenue data unavailable in demo mode.</p>
            </div>
            <button
              type="button"
              className="mt-6 rounded-full border border-white/25 px-4 py-2.5 text-sm font-semibold text-white/80"
            >
              Open payments
            </button>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
          <section id="leads" className="scroll-mt-6 rounded-2xl border border-border bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Business development</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight">New leads</h2>
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
                      <tr key={`${lead.name}-${lead.received}`} className="border-b border-border last:border-0">
                        <td className="py-4">
                          <p className="text-sm font-semibold">{lead.name}</p>
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
                          <button type="button" className="text-xs font-bold underline underline-offset-4">
                            Open
                          </button>
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
                Project and financial reporting will appear here when connected to live data.
              </p>
            </div>
            <DashboardState
              type="error"
              title="Reports unavailable"
              description="Demo mode does not connect to reporting data."
              action="Try again"
            />
          </div>
        </section>
      </main>
    </>
  );
}
