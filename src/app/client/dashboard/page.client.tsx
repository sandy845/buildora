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
const cardClass = "scroll-mt-28 rounded-[1.5rem] border border-border bg-white p-5 shadow-[0_12px_35px_-28px_rgba(14,19,25,0.35)] sm:p-6";

export function ClientDashboardClient({ navItems, stats, projects, activity, quotations, documents, messages, notifications, account }: Props) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const project = projects[0];
  const progress = project?.progress ?? 0;
  const currentPhase = progress >= 90 ? 4 : progress >= 70 ? 3 : progress >= 45 ? 2 : progress >= 20 ? 1 : 0;
  const stat = (label: string) => stats.find((item) => item.label === label);

  return (
    <main className="min-h-screen bg-[#f0ede7]">
      <header className="sticky top-0 z-30 border-b border-border bg-[#f8f6f0]/95 backdrop-blur">
        <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <button type="button" className="rounded-xl border border-border bg-white p-2.5 lg:hidden" onClick={() => setIsMobileNavOpen((open) => !open)} aria-label="Toggle navigation">
              <DashboardIcon name={isMobileNavOpen ? "file" : "grid"} className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a98032]">Buildora</p>
              <p className="mt-1 text-sm font-semibold text-primary">Client Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" className="relative rounded-full border border-border bg-white p-2.5 text-muted" aria-label="Notifications">
              <DashboardIcon name="bell" className="h-5 w-5" />
              {notifications.some((item) => item.unread) && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#c5a059] ring-2 ring-white" />}
            </button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-primary">{account?.name || "Client"}</p>
              <p className="text-xs text-muted">Customer account</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e5c875] text-xs font-black text-primary">
              {(account?.name || "YC").split(" ").map((part) => part[0]).slice(0, 2).join("")}
            </div>
          </div>
        </div>
        {isMobileNavOpen && <nav className="border-t border-border bg-white px-4 py-3 lg:hidden">{navItems.map((item) => <Link key={item.label} href={item.href} onClick={() => setIsMobileNavOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted hover:bg-background hover:text-primary"><DashboardIcon name={item.icon} className="h-5 w-5" /><span>{item.label}</span>{item.count ? <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">{item.count}</span> : null}</Link>)}</nav>}
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <section id="profile" className="scroll-mt-28 flex flex-col justify-between gap-6 border-b border-border pb-8 sm:flex-row sm:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a98032]">Your project overview</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-primary sm:text-4xl">Good to see you, {account?.name?.split(" ")[0] || "there"}.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted">Stay close to every decision, milestone, and detail across your Buildora project.</p></div>
          <Link href="/request-project" className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-[#c5a059] hover:text-primary">Start another project <span>→</span></Link>
        </section>

        <section className="grid gap-4 py-7 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item, index) => <article key={item.label} className={`${cardClass} ${index === 1 ? "border-[#c5a059]/45 bg-[#fffdf8]" : ""}`}><div className="flex items-start justify-between"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{item.label}</p><span className={`h-2 w-2 rounded-full ${index === 2 || index === 3 ? "bg-[#c5a059]" : "bg-emerald-500"}`} /></div><p className="mt-4 text-2xl font-semibold tracking-tight text-primary">{item.value}</p><p className="mt-2 text-xs text-muted">{item.detail}</p></article>)}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
          <section id="projects" className={cardClass}>
            <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Active project</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-primary">{project?.name || "Your Buildora project"}</h2><p className="mt-1 text-sm text-muted">{project?.type} · {project?.location}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">On track</span></div>
            {project ? <><div className="mt-7 flex items-end justify-between"><div><p className="text-xs uppercase tracking-[0.14em] text-muted">Overall completion</p><p className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-primary">{progress}%</p></div><p className="text-right text-xs text-muted">Current milestone<br /><strong className="mt-1 inline-block text-sm text-primary">{project.milestone}</strong></p></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-[#eee9dd]"><div className="dashboard-progress h-full rounded-full bg-[#c5a059]" style={{ width: `${progress}%` }} /></div><div className="mt-7 grid grid-cols-3 gap-3 text-xs"><div><p className="text-muted">Started</p><p className="mt-1 font-semibold text-primary">12 Aug 2026</p></div><div><p className="text-muted">Next due</p><p className="mt-1 font-semibold text-primary">{project.due}</p></div><div className="text-right"><p className="text-muted">Location</p><p className="mt-1 font-semibold text-primary">{project.location}</p></div></div></> : <DashboardState type="empty" title="No active projects" description="Your Buildora project will appear here once it is set up." />}
          </section>

          <section className="rounded-[1.5rem] bg-primary p-6 text-white shadow-xl shadow-primary/15"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e5c875]">Next important action</p><h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{quotations[0]?.title || "Review your project plan"}</h2><p className="mt-3 text-sm leading-6 text-white/65">Keep the project moving by reviewing the latest update from your Buildora team.</p><Link href="#approvals" className="mt-8 inline-flex rounded-full bg-[#e5c875] px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-white">Review now →</Link><div className="mt-8 border-t border-white/15 pt-5"><p className="text-xs text-white/55">Upcoming milestone</p><p className="mt-1 font-semibold">{project?.milestone || "Project review"}</p><p className="mt-1 text-xs text-white/55">{project?.due || "To be scheduled"}</p></div></section>
        </div>

        <section id="progress" className={`${cardClass} mt-6`}>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Project progress</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-primary">Progress over time</h2></div><div className="flex gap-4 text-xs text-muted"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-[#c5a059]" />Actual</span><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full border border-[#9ba4a0]" />Planned</span></div></div>
          <div className="mt-6 overflow-hidden"><svg viewBox="0 0 760 220" className="h-auto w-full min-w-[560px]" role="img" aria-label={`Project progress is ${progress} percent`}><path d="M40 185H730M40 140H730M40 95H730M40 50H730" stroke="#e4dec8" strokeWidth="1" /><path d="M40 178 C145 168 180 140 270 142 S390 118 470 104 S620 75 730 42" fill="none" stroke="#a6ada8" strokeDasharray="6 7" strokeWidth="2" /><path className="dashboard-chart-line" d={`M40 182 C145 172 180 160 270 154 S390 ${progress > 50 ? 126 : 145} 470 ${progress > 70 ? 94 : 124} S620 ${Math.max(70, 145 - progress / 2)} ${730 - progress / 3}`} fill="none" stroke="#c5a059" strokeLinecap="round" strokeWidth="4" /><circle cx="730" cy={Math.max(70, 145 - progress / 2)} r="6" fill="#c5a059" /><text x="40" y="211" fill="#625d57" fontSize="11">Aug</text><text x="260" y="211" fill="#625d57" fontSize="11">Sep</text><text x="470" y="211" fill="#625d57" fontSize="11">Oct</text><text x="700" y="211" fill="#625d57" fontSize="11">Nov</text></svg></div>
        </section>

        <section id="timeline" className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className={cardClass}><div className="flex justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Project status</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-primary">Your build journey</h2></div><span className="text-xs text-muted">{phases[currentPhase]} phase</span></div><div className="mt-8 flex items-start">{phases.map((phase, index) => <div key={phase} className="relative flex-1 text-center"><div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${index < currentPhase ? "border-[#c5a059] bg-[#c5a059] text-primary" : index === currentPhase ? "border-[#c5a059] bg-[#fffdf8] text-[#a98032] ring-4 ring-[#c5a059]/15" : "border-border bg-white text-muted"}`}>{index < currentPhase ? "✓" : String(index + 1).padStart(2, "0")}</div>{index < phases.length - 1 && <span className={`absolute left-1/2 top-4 h-px w-full ${index < currentPhase ? "bg-[#c5a059]" : "bg-border"}`} /> }<p className="relative mt-3 text-[10px] font-semibold text-muted sm:text-xs">{phase}</p></div>)}</div></div>
          <div className={cardClass}><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Recent activity</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-primary">Latest updates</h2><div className="mt-5 divide-y divide-border">{activity.slice(0, 4).map((item) => <div key={`${item.title}-${item.detail}`} className="flex gap-3 py-3 first:pt-0"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f3efe5] text-[#a98032]"><DashboardIcon name={item.icon} className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-primary">{item.title}</p><p className="mt-1 text-xs text-muted">{item.detail}</p></div></div>)}</div></div>
        </section>

        <section id="payments" className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className={cardClass}><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Cost & payments</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-primary">Financial summary</h2></div><DashboardIcon name="card" className="h-5 w-5 text-muted" /></div><div className="mt-6 grid gap-5 sm:grid-cols-3"><div><p className="text-xs text-muted">Approved quotation</p><p className="mt-2 text-xl font-semibold text-primary">{quotations[0]?.detail.split(" · ")[0] || "₹48,00,000"}</p></div><div><p className="text-xs text-muted">Amount paid</p><p className="mt-2 text-xl font-semibold text-primary">₹32,40,000</p></div><div><p className="text-xs text-muted">Remaining balance</p><p className="mt-2 text-xl font-semibold text-primary">{stat("Outstanding payment")?.value || "₹84,500"}</p></div></div><div className="mt-6 border-t border-border pt-4 text-sm text-muted">Next payment due <strong className="text-primary">18 Sep 2026</strong><span className="mx-2">·</span><span className="font-semibold text-[#a98032]">Pending review</span></div></div>
          <div id="approvals" className={cardClass}><div className="flex justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Design approvals</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-primary">Action required</h2></div><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">{quotations.length || 0} pending</span></div><div className="mt-5">{quotations.length ? quotations.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 border-t border-border py-3"><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted">{item.detail}</p></div><button type="button" className="rounded-full border border-border px-3 py-1.5 text-xs font-bold text-primary hover:border-[#c5a059]">Review</button></div>) : <DashboardState type="empty" title="Nothing waiting for approval" description="New design decisions will appear here." />}</div></div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div id="documents" className={cardClass}><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Documents</p><h2 className="mt-2 text-xl font-semibold text-primary">Recent files</h2><div className="mt-4 divide-y divide-border">{documents.length ? documents.map((item) => <div key={item.id} className="flex gap-3 py-3 first:pt-0"><DashboardIcon name="file" className="mt-0.5 h-4 w-4 text-muted" /><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted">{item.detail}</p></div></div>) : <DashboardState type="empty" title="No recent files" description="Your project documents will appear here." />}</div></div>
          <div id="messages" className={cardClass}><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Messages</p><h2 className="mt-2 text-xl font-semibold text-primary">From your team</h2><div className="mt-4 divide-y divide-border">{messages.length ? messages.map((item) => <div key={item.id} className="py-3 first:pt-0"><p className="line-clamp-2 text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted">{item.detail}</p></div>) : <p className="py-5 text-sm text-muted">No new messages.</p>}</div><Link href="#messages" className="mt-4 inline-block text-xs font-bold text-[#a98032]">View messages →</Link></div>
          <div id="notifications" className={cardClass}><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a98032]">Notifications</p><h2 className="mt-2 text-xl font-semibold text-primary">Stay informed</h2><div className="mt-4 space-y-4">{notifications.length ? notifications.map((item) => <div key={item.id} className="flex gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.unread ? "bg-[#c5a059]" : "bg-border"}`} /><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs leading-5 text-muted">{item.detail}</p></div></div>) : <p className="py-5 text-sm text-muted">You’re all caught up.</p>}</div></div>
        </section>
      </div>
    </main>
  );
}
