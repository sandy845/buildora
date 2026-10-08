"use client";

import Link from "next/link";
import { useState } from "react";
import { DashboardIcon } from "@/components/client/dashboard-icons";
import { DashboardState } from "@/components/client/dashboard-state";

type Props = {
  navItems: { label: string; href: string; icon: string; count?: number }[];
  stats: { label: string; value: string; detail: string; tone: string }[];
  projects: { id: string; name: string; type: string; location: string; progress: number; milestone: string; due: string; color: string }[];
  activity: { title: string; detail: string; icon: string; tone: string }[];
  quotations: { id: string; title: string; detail: string }[];
  documents: { id: string; title: string; detail: string }[];
  messages: { id: string; title: string; detail: string }[];
  notifications: { id: string; title: string; detail: string; unread: boolean }[];
  account: { name: string; email: string } | null;
};

const phases = ["Planning", "Design", "Approval", "Construction", "Finishing", "Completed"];
const cardClass = "dashboard-card scroll-mt-28 rounded-[1.5rem] border border-border bg-white p-5 shadow-[0_12px_35px_-28px_rgba(14,19,25,0.35)] sm:p-6";

export function ClientDashboardClient({ navItems, stats, projects, activity, quotations, documents, messages, notifications, account }: Props) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [notificationItems, setNotificationItems] = useState(notifications);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || "");

  const project = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const progress = project?.progress ?? 0;
  const currentPhase = progress >= 90 ? 4 : progress >= 70 ? 3 : progress >= 45 ? 2 : progress >= 20 ? 1 : 0;
  const accountName = account?.name || "Client";
  const accountEmail = account?.email || "";
  const accountInitials = accountName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const stat = (label: string) => stats.find((item) => item.label === label);

  const markNotificationRead = async (id: string) => {
    const item = notificationItems.find((notification) => notification.id === id);
    if (!item?.unread) return;
    const response = await fetch(`/api/client/notifications/${id}`, { method: "PATCH" });
    if (!response.ok) {
      console.error("Unable to mark notification as read:", response.status);
      return;
    }
    setNotificationItems((current) => current.map((notification) => notification.id === id ? { ...notification, unread: false } : notification));
  };

  const updateQuotation = async (id: string, status: "accepted" | "rejected") => {
    const response = await fetch(`/api/client/quotations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      console.error("Unable to update quotation:", response.status);
      return;
    }
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-[#f0ede7]">
      <header className="sticky top-0 z-30 border-b border-border bg-[#f8f6f0]/95 backdrop-blur">
        <div className="flex h-[4.5rem] items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <button type="button" className="rounded-lg border border-border bg-white p-2 lg:hidden" onClick={() => setIsMobileNavOpen((open) => !open)} aria-label="Toggle navigation">
              <DashboardIcon name={isMobileNavOpen ? "file" : "grid"} className="h-5 w-5" />
            </button>
            <Link href="/" className="transition-opacity hover:opacity-75">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a98032]">Buildora</p>
              <p className="mt-1 text-sm font-semibold text-primary">Client Portal</p>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" className="relative rounded-lg p-2 text-muted transition-colors hover:bg-white hover:text-primary" aria-label="Notifications">
              <DashboardIcon name="bell" className="h-[1.15rem] w-[1.15rem]" />
              {notificationItems.some((item) => item.unread) && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#c5a059] ring-2 ring-[#f8f6f0]" />}
            </button>
            <Link href="/client/profile" className="flex items-center gap-3 border-l border-border pl-4 text-left transition-opacity hover:opacity-75">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5c875] text-xs font-bold text-primary">{accountInitials || "C"}</span>
              <span className="hidden max-w-44 sm:block">
                <span className="block truncate text-sm font-semibold leading-5 text-primary">{accountName}</span>
                <span className="block truncate text-xs text-muted">{accountEmail}</span>
              </span>
              <span className="sr-only">View your profile</span>
            </Link>
          </div>
        </div>
        {isMobileNavOpen && (
          <nav className="border-t border-border bg-white px-4 py-3 lg:hidden">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted hover:bg-background hover:text-primary">
                <DashboardIcon name={item.icon} className="h-5 w-5" />
                <span>{item.label}</span>
                {item.count ? <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">{item.count}</span> : null}
              </Link>
            ))}
            <Link href="/client/profile" onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-primary hover:bg-background">
              <DashboardIcon name="user" className="h-5 w-5" />
              <span>My profile</span>
            </Link>
          </nav>
        )}
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <section id="profile" className="scroll-mt-28 flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a98032]">Your project overview</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-primary sm:text-4xl">Good to see you, {accountName}.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              {projects.length === 0
                ? "Welcome to your Buildora client portal. Get started by submitting your requirements to receive your customized architectural plan and schedule."
                : "Stay close to every decision, milestone, and detail across your Buildora project."}
            </p>
          </div>
          <Link href="/request-project" className="group inline-flex w-fit items-center gap-3 rounded-full border border-[#c5a059] bg-transparent px-5 py-3 text-sm font-bold text-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#c5a059] hover:text-primary hover:shadow-[0_10px_24px_-12px_rgba(197,160,89,0.9)]">
            {projects.length === 0 ? "Start your first project" : "Start another project"}
            <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
          </Link>
        </section>

        <section aria-label="Project snapshot" className="grid gap-4 border-b border-border py-7 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item, index) => (
            <article key={item.label} className={`${cardClass} ${index === 1 ? "border-[#c5a059]/45 bg-[#fffdf8]" : ""}`}>
              <div className="flex items-start justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{item.label}</p>
                <span className={`h-2 w-2 rounded-full ${item.value === "0" || item.value === "0%" || item.value === "₹0" ? "bg-slate-300" : index === 2 || index === 3 ? "bg-[#c5a059]" : "bg-emerald-500"}`} />
              </div>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-primary">{item.value}</p>
              <p className="mt-2 text-xs text-muted">{item.detail}</p>
            </article>
          ))}
        </section>

        <section aria-labelledby="project-overview-heading" className="mt-10">
          <div className="mb-5 flex items-center gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a98032]">01 / Project overview</p>
              <h2 id="project-overview-heading" className="mt-1 text-lg font-semibold text-primary">What needs your attention now</h2>
            </div>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
            <section id="projects" className={cardClass}>
              {project ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Active project</p>
                        {projects.length > 1 && (
                          <span className="rounded-full bg-[#c5a059]/15 px-2 py-0.5 text-[10px] font-bold text-[#a98032]">
                            {projects.indexOf(project) + 1} of {projects.length}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-primary">{project.name}</h2>
                        {projects.length > 1 && (
                          <select
                            value={project.id}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            aria-label="Select active project"
                            className="rounded-lg border border-[#d9cba8] bg-[#fffdf8] px-2.5 py-1 text-xs font-semibold text-primary outline-none focus:border-[#c5a059]"
                          >
                            {projects.map((p) => (
                              <option key={p.id} value={p.id}>
                                Switch: {p.name} ({p.progress}%)
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted">{project.type} · {project.location}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">On track</span>
                      <Link
                        href={`/client/projects/${project.id}`}
                        className="text-xs font-semibold text-[#a98032] hover:underline"
                      >
                        Workspace →
                      </Link>
                    </div>
                  </div>
                  <div className="mt-7 flex items-end justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-muted">Overall completion</p>
                      <p className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-primary">{progress}%</p>
                    </div>
                    <p className="text-right text-xs text-muted">Current milestone<br /><strong className="mt-1 inline-block text-sm text-primary">{project.milestone}</strong></p>
                  </div>
                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#eee9dd]">
                    <div className="dashboard-progress h-full rounded-full bg-[#c5a059]" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="mt-7 grid grid-cols-3 gap-3 text-xs">
                    <div><p className="text-muted">Started</p><p className="mt-1 font-semibold text-primary">Recently</p></div>
                    <div><p className="text-muted">Next due</p><p className="mt-1 font-semibold text-primary">{project.due}</p></div>
                    <div className="text-right"><p className="text-muted">Location</p><p className="mt-1 font-semibold text-primary">{project.location}</p></div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Active project</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-primary">No projects yet</h2>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">Awaiting project</span>
                  </div>
                  <div className="mt-6">
                    <DashboardState
                      type="empty"
                      title="No active projects"
                      description="You don't have any projects underway yet. Request a custom quote or contact our architectural engineering team to get started."
                      action={{ label: "Request a project estimate", href: "/request-project" }}
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="dashboard-card rounded-[1.5rem] border border-[#d9cba8] bg-[#fffdf8] p-6 shadow-[0_18px_40px_-28px_rgba(197,160,89,0.55)]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Next important action</p>
              {project ? (
                <>
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-primary">{quotations[0]?.title || "Review your project plan"}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted">Keep the project moving by reviewing the latest update from your Buildora team.</p>
                  <Link href="#approvals" className="mt-8 inline-flex rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#c5a059] hover:text-primary">Review now →</Link>
                  <div className="mt-8 border-t border-[#d9cba8] pt-5">
                    <p className="text-xs text-muted">Upcoming milestone</p>
                    <p className="mt-1 font-semibold text-primary">{project.milestone}</p>
                    <p className="mt-1 text-xs text-muted">{project.due}</p>
                  </div>
                </>
              ) : (
                <div className="py-2">
                  <h2 className="mt-3 text-xl font-semibold tracking-tight text-primary">Get started with Buildora</h2>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    Submit your site dimensions and project vision to get an initial cost estimate, floor plan concepts, and milestone schedule.
                  </p>
                  <Link href="/request-project" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#c5a059] hover:text-primary">
                    Start a project estimate →
                  </Link>
                </div>
              )}
            </section>
          </div>

          {projects.length > 1 && (
            <div className="mt-8 rounded-3xl border border-[#d9cba8] bg-[#fffdf8] p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Your Project Portfolio</p>
                  <h3 className="mt-1 text-lg font-semibold text-primary">Switch active project on dashboard</h3>
                </div>
                <p className="text-xs text-muted">Click any project to inspect its milestones, progress, and finances</p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((p) => {
                  const isSelected = p.id === project.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      className={`group cursor-pointer rounded-2xl border p-5 transition-all ${
                        isSelected
                          ? "border-[#c5a059] bg-[#faf8f3] shadow-md ring-2 ring-[#c5a059]/40"
                          : "border-border bg-white hover:border-[#c5a059]/50 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`h-2.5 w-2.5 rounded-full ${isSelected ? "bg-[#c5a059]" : "bg-emerald-500"}`} />
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
                          isSelected ? "bg-[#0a0e14] text-white" : "bg-[#f3efe5] text-primary group-hover:bg-[#c5a059] group-hover:text-primary"
                        }`}>
                          {isSelected ? "Active on dashboard" : "Select to view"}
                        </span>
                      </div>
                      <h4 className="mt-3 text-base font-semibold text-primary">{p.name}</h4>
                      <p className="mt-0.5 text-xs text-muted">{p.type} · {p.location}</p>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-muted">
                          <span>Progress</span>
                          <span className="font-bold text-primary">{p.progress}%</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#eee9dd]">
                          <div className="h-full rounded-full bg-[#c5a059]" style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                        <span className="text-muted">Milestone: {p.milestone}</span>
                        <Link
                          href={`/client/projects/${p.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-[#a98032] hover:underline"
                        >
                          Workspace →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* ── 02 / PROGRESS ─────────────────────────────────────────── */}
        <section aria-labelledby="progress-heading" className="mt-12">
          <div className="mb-5 flex items-center gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a98032]">02 / Progress</p>
              <h2 id="progress-heading" className="mt-1 text-lg font-semibold text-primary">Track the build at a glance</h2>
            </div>
            <span className="h-px flex-1 bg-border" />
          </div>

          <section id="progress" className={`${cardClass} overflow-hidden`}>
            {project ? (
              <>
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Project progress</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-primary">
                      {project.name}
                    </h2>
                    <p className="mt-1 text-sm text-muted">{project.type} · {project.location}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#d9cba8] bg-[#fffdf8] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#a98032]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/25" />
                    Active
                  </span>
                </div>

                <div className="mt-8 flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-14">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#e5c875]/20 via-transparent to-[#c5a059]/10" style={{ borderRadius: "50%" }} />
                    <svg width="220" height="220" viewBox="0 0 220 220" className="drop-shadow-sm" aria-label={`Project is ${progress}% complete`}>
                      <circle cx="110" cy="110" r="90" fill="none" stroke="#eae5d6" strokeWidth="10" />
                      <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(197,160,89,0.08)" strokeWidth="18" />
                      <circle
                        className="progress-ring-fill"
                        cx="110" cy="110" r="90"
                        fill="none"
                        stroke="url(#ringGrad)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        style={{
                          "--ring-offset": `${565.49 * (1 - progress / 100)}`,
                        } as React.CSSProperties}
                      />
                      <defs>
                        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ab8536" />
                          <stop offset="50%" stopColor="#e5c875" />
                          <stop offset="100%" stopColor="#c5a059" />
                        </linearGradient>
                      </defs>
                      {(() => {
                        const angle = (progress / 100) * 360 - 90;
                        const rad = (angle * Math.PI) / 180;
                        const cx = 110 + 90 * Math.cos(rad);
                        const cy = 110 + 90 * Math.sin(rad);
                        return progress > 2 ? (
                          <>
                            <circle cx={cx} cy={cy} r="10" fill="rgba(197,160,89,0.18)" className="ring-live-dot" />
                            <circle cx={cx} cy={cy} r="6" fill="#c5a059" stroke="#fff" strokeWidth="2" />
                          </>
                        ) : null;
                      })()}
                      <text x="110" y="100" textAnchor="middle" fontSize="38" fontWeight="700" fill="#0e1319" fontFamily="var(--font-manrope),system-ui">{progress}%</text>
                      <text x="110" y="122" textAnchor="middle" fontSize="11" fontWeight="600" fill="#625d57" letterSpacing="0.12em">COMPLETE</text>
                      <text x="110" y="140" textAnchor="middle" fontSize="10" fill="#9b9590">{phases[currentPhase]} phase</text>
                    </svg>
                  </div>

                  <div className="flex w-full flex-1 flex-col gap-8">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Current phase", value: phases[currentPhase], icon: "📍" },
                        { label: "Next milestone", value: project.milestone, icon: "🏁" },
                        { label: "Target date", value: project.due, icon: "📅" },
                      ].map((chip, i) => (
                        <div
                          key={chip.label}
                          className="progress-stat-chip rounded-2xl border border-[#e4dec8] bg-[#faf8f3] p-4"
                          style={{ animationDelay: `${180 + i * 80}ms` }}
                        >
                          <p className="text-lg">{chip.icon}</p>
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">{chip.label}</p>
                          <p className="mt-1 truncate text-sm font-semibold text-primary">{chip.value}</p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Build journey</p>
                      <div className="flex items-start">
                        {phases.map((phase, i) => {
                          const done = i < currentPhase;
                          const active = i === currentPhase;
                          return (
                            <div key={phase} className="relative flex-1 text-center">
                              {i > 0 && (
                                <span className="absolute left-0 top-[17px] block h-px w-1/2 -translate-x-full origin-left bg-border" aria-hidden="true">
                                  {done && <span className="phase-connector-fill absolute inset-0 origin-left bg-[#c5a059]" style={{ animationDelay: `${300 + i * 120}ms` }} />}
                                </span>
                              )}
                              {i < phases.length - 1 && (
                                <span className="absolute left-1/2 top-[17px] block h-px w-1/2 origin-left bg-border" aria-hidden="true">
                                  {done && <span className="phase-connector-fill absolute inset-0 origin-left bg-[#c5a059]" style={{ animationDelay: `${300 + i * 120}ms` }} />}
                                </span>
                              )}
                              <div
                                className={`phase-node-pop relative z-10 mx-auto flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                                  done
                                    ? "border-2 border-[#c5a059] bg-[#c5a059] text-white shadow-md shadow-[#c5a059]/30"
                                    : active
                                    ? "border-2 border-[#c5a059] bg-white text-[#a98032] ring-4 ring-[#c5a059]/20 shadow-md shadow-[#c5a059]/20"
                                    : "border-2 border-border bg-white text-muted"
                                }`}
                                style={{ animationDelay: `${250 + i * 90}ms` }}
                              >
                                {done ? "✓" : <span className="text-[10px]">{String(i + 1).padStart(2, "0")}</span>}
                              </div>
                              <p className={`relative mt-2.5 text-[9px] font-semibold uppercase tracking-[0.08em] leading-tight ${active ? "text-[#a98032]" : done ? "text-primary" : "text-muted"}`}>
                                {phase}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs text-muted">
                        <span className="font-medium">Overall completion</span>
                        <span className="font-bold text-[#a98032]">{progress}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[#eae5d6]">
                        <div
                          className="dashboard-progress h-full rounded-full"
                          style={{
                            width: `${progress}%`,
                            background: "linear-gradient(90deg, #ab8536 0%, #e5c875 60%, #c5a059 100%)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <DashboardState
                type="empty"
                title="No project build in progress"
                description="Live progress rings, milestone steppers, and completion metrics will appear here as soon as your construction or architectural work begins."
                action={{ label: "Start your project", href: "/request-project" }}
              />
            )}
          </section>
        </section>

        {/* ── 03 / COORDINATION ─────────────────────────────────────────── */}
        <section aria-labelledby="timeline-heading" className="mt-12">
          <div className="mb-5 flex items-center gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a98032]">03 / Coordination</p>
              <h2 id="timeline-heading" className="mt-1 text-lg font-semibold text-primary">Milestones and recent updates</h2>
            </div>
            <span className="h-px flex-1 bg-border" />
          </div>
          <section id="timeline" className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className={cardClass}>
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Project status</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-primary">Your build journey</h2>
                </div>
                <span className="text-xs text-muted">{project ? `${phases[currentPhase]} phase` : "Not initiated"}</span>
              </div>
              {project ? (
                <div className="mt-8 flex items-start">
                  {phases.map((phase, index) => (
                    <div key={phase} className="relative flex-1 text-center">
                      <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${index < currentPhase ? "border-[#c5a059] bg-[#c5a059] text-primary" : index === currentPhase ? "border-[#c5a059] bg-[#fffdf8] text-[#a98032] ring-4 ring-[#c5a059]/15" : "border-border bg-white text-muted"}`}>
                        {index < currentPhase ? "✓" : String(index + 1).padStart(2, "0")}
                      </div>
                      {index < phases.length - 1 && <span className={`absolute left-1/2 top-4 h-px w-full ${index < currentPhase ? "bg-[#c5a059]" : "bg-border"}`} />}
                      <p className="relative mt-3 text-[10px] font-semibold text-muted sm:text-xs">{phase}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6">
                  <DashboardState
                    type="empty"
                    title="Journey not started"
                    description="From initial architectural planning to final handover, you will be able to follow each phase of your build journey right here."
                  />
                </div>
              )}
            </div>

            <div className={cardClass}>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Recent activity</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-primary">Latest updates</h2>
              {activity.length > 0 ? (
                <div className="mt-5 divide-y divide-border">
                  {activity.slice(0, 4).map((item) => (
                    <div key={`${item.title}-${item.detail}`} className="flex gap-3 py-3 first:pt-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f3efe5] text-[#a98032]">
                        <DashboardIcon name={item.icon} className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-primary">{item.title}</p>
                        <p className="mt-1 text-xs text-muted">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5">
                  <DashboardState
                    type="empty"
                    title="No recent activity"
                    description="Site inspections, structural updates, and milestone verifications will appear here as your project advances."
                  />
                </div>
              )}
            </div>
          </section>
        </section>

        {/* ── 04 / DECISIONS ─────────────────────────────────────────── */}
        <section aria-labelledby="finance-heading" className="mt-12">
          <div className="mb-5 flex items-center gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a98032]">04 / Decisions</p>
              <h2 id="finance-heading" className="mt-1 text-lg font-semibold text-primary">Finances and approvals</h2>
            </div>
            <span className="h-px flex-1 bg-border" />
          </div>
          <section id="payments" className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className={cardClass}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Cost & payments</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-primary">Financial summary</h2>
                </div>
                <DashboardIcon name="card" className="h-5 w-5 text-muted" />
              </div>
              {project ? (
                <>
                  <div className="mt-6 grid gap-5 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted">Approved quotation</p>
                      <p className="mt-2 text-xl font-semibold text-primary">{quotations[0]?.detail.split(" · ")[0] || "Pending quote"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Amount paid</p>
                      <p className="mt-2 text-xl font-semibold text-primary">₹0</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Remaining balance</p>
                      <p className="mt-2 text-xl font-semibold text-primary">{stat("Outstanding payment")?.value || "₹0"}</p>
                    </div>
                  </div>
                  <div className="mt-6 border-t border-border pt-4 text-sm text-muted">
                    Payment status: <strong className="text-primary">{stat("Outstanding payment")?.value === "₹0" ? "All cleared" : "Payment pending"}</strong>
                  </div>
                </>
              ) : (
                <div className="mt-5">
                  <DashboardState
                    type="empty"
                    title="No financial records"
                    description="Quotations, payment receipts, and milestone invoices will appear here once your project is active."
                  />
                </div>
              )}
            </div>

            <div id="approvals" className={cardClass}>
              <div className="flex justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Design approvals</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-primary">Action required</h2>
                </div>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">{quotations.length} pending</span>
              </div>
              <div className="mt-5">
                {quotations.length ? (
                  quotations.map((item) => (
                    <div key={item.id} className="border-t border-border py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{item.title}</p>
                          <p className="mt-1 text-xs text-muted">{item.detail}</p>
                        </div>
                        <span className="rounded-full border border-border px-3 py-1.5 text-xs font-bold text-primary">Review</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => void updateQuotation(item.id, "accepted")} className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-[#c5a059] hover:text-primary">Accept</button>
                        <button type="button" onClick={() => void updateQuotation(item.id, "rejected")} className="rounded-full border border-border px-3 py-1.5 text-xs font-bold text-primary hover:border-[#c5a059]">Request revision</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <DashboardState type="empty" title="Nothing waiting for approval" description="New design decisions and drawings for review will appear here." />
                )}
              </div>
            </div>
          </section>
        </section>

        {/* ── 05 / RESOURCES ─────────────────────────────────────────── */}
        <section aria-labelledby="resources-heading" className="mt-12">
          <div className="mb-5 flex items-center gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a98032]">05 / Resources</p>
              <h2 id="resources-heading" className="mt-1 text-lg font-semibold text-primary">Stay connected to your project</h2>
            </div>
            <span className="h-px flex-1 bg-border" />
          </div>
          <section className="grid gap-6 lg:grid-cols-3">
            <div id="documents" className={cardClass}>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Documents</p>
              <h2 className="mt-2 text-xl font-semibold text-primary">Recent files</h2>
              <div className="mt-4 divide-y divide-border">
                {documents.length ? (
                  documents.map((item) => (
                    <div key={item.id} className="flex gap-3 py-3 first:pt-0">
                      <DashboardIcon name="file" className="mt-0.5 h-4 w-4 text-muted" />
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-1 text-xs text-muted">{item.detail}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <DashboardState type="empty" title="No recent files" description="Your architectural drawings, engineering permits, and project documents will appear here." />
                )}
              </div>
            </div>

            <div id="messages" className={cardClass}>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Messages</p>
              <h2 className="mt-2 text-xl font-semibold text-primary">From your team</h2>
              <div className="mt-4 divide-y divide-border">
                {messages.length ? (
                  messages.map((item) => (
                    <div key={item.id} className="py-3 first:pt-0">
                      <p className="line-clamp-2 text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs text-muted">{item.detail}</p>
                    </div>
                  ))
                ) : (
                  <p className="py-5 text-sm text-muted">No new messages from your project manager.</p>
                )}
              </div>
              <Link href="#messages" className="mt-4 inline-block text-xs font-bold text-[#a98032]">View messages →</Link>
            </div>

            <div id="notifications" className={cardClass}>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Notifications</p>
              <h2 className="mt-2 text-xl font-semibold text-primary">Stay informed</h2>
              <div className="mt-4 space-y-4">
                {notificationItems.length ? (
                  notificationItems.map((item) => (
                    <button key={item.id} type="button" onClick={() => void markNotificationRead(item.id)} className="flex w-full gap-3 text-left">
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.unread ? "bg-[#c5a059]" : "bg-border"}`} />
                      <span>
                        <span className="block text-sm font-semibold">{item.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-muted">{item.detail}</span>
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="py-5 text-sm text-muted">You’re all caught up.</p>
                )}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
