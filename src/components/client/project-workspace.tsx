"use client";

import Link from "next/link";
import { useState } from "react";
import { DashboardIcon } from "@/components/client/dashboard-icons";
import { DashboardState } from "@/components/client/dashboard-state";
import { ProjectFileIcon, ProjectProgress, ProjectSectionHeading, ProjectStatus } from "@/components/client/project-primitives";
import { FileUploadModal } from "@/components/client/file-upload-modal";

type ProjectData = {
  id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  overallProgress: number;
  startDate: string;
  targetDate: string;
  currentPhase: string;
  currentPhaseProgress: number;
  nextAction: { title: string; description: string; due: string };
  phases: { name: string; state: "complete" | "current" | "upcoming"; progress: number }[];
  timeline: { title: string; date: string; detail: string; state: string }[];
  approvals: { id: string; title: string; detail: string; due: string }[];
  designs: { name: string; type: string; status: string }[];
  materials: { name: string; supplier: string; status: string }[];
  documents: { name: string; type: string; date: string }[];
  outstandingPayment: number;
};

const tabs = ["Overview", "Progress", "Timeline", "Designs", "Materials", "Approvals", "Documents", "Payments", "Messages", "Support"];

export function ProjectWorkspaceClient({ project }: { project: ProjectData }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);
  const [designsList, setDesignsList] = useState(project.designs);
  const [documentsList, setDocumentsList] = useState(project.documents);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<"document" | "blueprint">("document");

  function selectTab(tab: string) {
    setActiveTab(tab);
    setIsTabMenuOpen(false);
    document.getElementById(tab.toLowerCase())?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-[#f0ede7] text-primary">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm">
              <Link href="/client/dashboard" className="font-semibold text-muted hover:text-primary">
                Dashboard
              </Link>
              <span className="text-border">/</span>
              <span className="font-semibold">My projects</span>
            </div>
            <Link href="/client/dashboard" className="text-sm font-semibold text-muted hover:text-primary">
              Back to overview
            </Link>
          </div>
          <div className="mt-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Project workspace</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tighter sm:text-4xl">{project.name}</h1>
              <p className="mt-2 text-sm text-muted">
                {project.type} · {project.location}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ProjectStatus>{project.status}</ProjectStatus>
              <button type="button" className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white">
                Contact team
              </button>
            </div>
          </div>
        </div>

        {/* Desktop tab nav */}
        <div className="mx-auto hidden max-w-7xl overflow-x-auto px-4 sm:px-6 lg:block lg:px-10">
          <nav aria-label="Project sections" className="flex min-w-max gap-7">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => selectTab(tab)}
                className={`border-b-2 px-0 py-4 text-sm font-semibold ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted hover:text-primary"}`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile tab menu */}
        <div className="px-4 py-3 sm:px-6 lg:hidden">
          <button
            type="button"
            aria-expanded={isTabMenuOpen}
            onClick={() => setIsTabMenuOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold"
          >
            <span>{activeTab}</span>
            <DashboardIcon name={isTabMenuOpen ? "file" : "grid"} className="h-4 w-4" />
          </button>
          {isTabMenuOpen && (
            <nav aria-label="Mobile project sections" className="mt-2 grid gap-1 rounded-xl border border-border bg-background p-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => selectTab(tab)}
                  className={`rounded-lg px-3 py-2 text-left text-sm font-semibold ${activeTab === tab ? "bg-primary text-white" : "text-muted"}`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        {/* Overview */}
        <section id="overview" className="grid scroll-mt-6 gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
          <div className="rounded-2xl border border-border bg-white p-5 sm:p-7">
            <ProjectSectionHeading eyebrow="Project overview" title="A clear view of what happens next" />
            <div className="mt-7 grid gap-7 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-end">
              <div>
                <div className="flex items-end justify-between">
                  <span className="text-sm font-semibold">Overall progress</span>
                  <span className="text-3xl font-semibold tracking-tight">{project.overallProgress}%</span>
                </div>
                <ProjectProgress value={project.overallProgress} className="mt-3" />
                <div className="mt-3 flex justify-between text-xs text-muted">
                  <span>Started {project.startDate}</span>
                  <span>Target {project.targetDate}</span>
                </div>
              </div>
              <div className="border-l-0 border-border sm:border-l sm:pl-6">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Current phase</p>
                <p className="mt-2 font-semibold">{project.currentPhase}</p>
                <p className="mt-1 text-xs text-muted">{project.currentPhaseProgress}% complete</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-primary p-5 text-white sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">Your next action</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">{project.nextAction.title}</h2>
            <p className="mt-3 text-sm leading-6 text-white/65">{project.nextAction.description}</p>
            {project.nextAction.due && (
              <p className="mt-6 text-xs font-semibold text-amber-300">{project.nextAction.due}</p>
            )}
            <button type="button" className="mt-5 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-primary">
              Review approval
            </button>
          </div>
        </section>

        {/* Progress / Phases */}
        <section id="progress" className="mt-6 scroll-mt-6 rounded-2xl border border-border bg-white p-5 sm:p-7">
          <ProjectSectionHeading eyebrow="Progress" title="Project phases" action="View detailed progress" />
          {project.phases.length === 0 ? (
            <div className="mt-7">
              <DashboardState type="empty" title="No phases set up" description="Your project team will add phases here." />
            </div>
          ) : (
            <div className="mt-7 grid gap-4 md:grid-cols-5">
              {project.phases.map((phase, index) => (
                <div key={phase.name} className="relative">
                  <div className="flex items-center gap-3 md:block">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${phase.state === "complete" ? "bg-primary text-white" : phase.state === "current" ? "bg-amber-400 text-primary" : "bg-background text-muted"}`}
                    >
                      {phase.state === "complete" ? "✓" : index + 1}
                    </span>
                    <p className="text-sm font-semibold md:mt-3">{phase.name}</p>
                  </div>
                  <div className="mt-3 hidden h-1.5 rounded-full bg-background md:block">
                    <div
                      className={`h-full rounded-full ${phase.state === "current" ? "bg-amber-500" : "bg-primary"}`}
                      style={{ width: `${phase.progress}%` }}
                    />
                  </div>
                  <p className="mt-2 hidden text-xs text-muted md:block">
                    {phase.state === "complete" ? "Complete" : phase.state === "current" ? `${phase.progress}% complete` : "Upcoming"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {/* Timeline */}
          <section id="timeline" className="scroll-mt-6 rounded-2xl border border-border bg-white p-5 sm:p-7">
            <ProjectSectionHeading eyebrow="Timeline" title="Recent project milestones" action="Full timeline" />
            <div className="mt-6 space-y-5">
              {project.timeline.length === 0 ? (
                <DashboardState type="empty" title="No timeline events yet" description="Activity will appear here as your project progresses." />
              ) : (
                project.timeline.map((item, idx) => (
                  <div key={`${item.title}-${idx}`} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="mt-1 h-3 w-3 rounded-full bg-primary" />
                      {idx !== project.timeline.length - 1 && <span className="mt-2 h-full w-px bg-border" />}
                    </div>
                    <div className="pb-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <span className="text-xs text-muted">{item.date}</span>
                      </div>
                      {item.detail && <p className="mt-1 text-xs leading-5 text-muted">{item.detail}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Approvals */}
          <section id="approvals" className="scroll-mt-6 rounded-2xl border border-border bg-white p-5 sm:p-7">
            <ProjectSectionHeading eyebrow="Action required" title="Approvals" action="View all" />
            <div className="mt-6 space-y-3">
              {project.approvals.length === 0 ? (
                <DashboardState type="empty" title="No pending approvals" description="Items requiring your review will appear here." />
              ) : (
                project.approvals.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl bg-background p-3">
                    <ProjectFileIcon />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {item.detail} · {item.due}
                      </p>
                    </div>
                    <button type="button" className="shrink-0 text-xs font-bold text-primary underline underline-offset-4">
                      Review
                    </button>
                  </div>
                ))
              )}
            </div>
            {project.approvals.length > 0 && (
              <p className="mt-5 border-t border-border pt-4 text-xs text-muted">
                {project.approvals.length} approval{project.approvals.length !== 1 ? "s are" : " is"} waiting for your review.
              </p>
            )}
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {/* Designs */}
          <section id="designs" className="scroll-mt-6 rounded-2xl border border-border bg-white p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ProjectSectionHeading eyebrow="Designs & Blueprints" title="Architectural Drawings" />
              <button
                type="button"
                onClick={() => {
                  setUploadCategory("blueprint");
                  setIsUploadOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2a2a2a]"
              >
                + Upload blueprint
              </button>
            </div>
            <div className="mt-6 space-y-3">
              {designsList.length === 0 ? (
                <DashboardState type="empty" title="No blueprints yet" description="CAD drawings and floor plans will appear here once uploaded." />
              ) : (
                designsList.map((item) => (
                  <div key={item.name} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                    <ProjectFileIcon name="grid" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs text-muted">{item.type}</p>
                    </div>
                    <span className={`text-xs font-semibold ${item.status === "Approved" ? "text-emerald-700" : "text-amber-700"}`}>
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Materials */}
          <section id="materials" className="scroll-mt-6 rounded-2xl border border-border bg-white p-5 sm:p-7">
            <ProjectSectionHeading eyebrow="Materials" title="Material schedule" action="View schedule" />
            <div className="mt-6 space-y-3">
              {project.materials.length === 0 ? (
                <DashboardState type="empty" title="No materials scheduled" description="Your material schedule will appear here." />
              ) : (
                project.materials.map((item) => (
                  <div key={item.name} className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
                    <ProjectFileIcon name="building" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs text-muted">{item.supplier}</p>
                    </div>
                    <span className={`text-xs font-semibold ${item.status === "Approved" || item.status === "Ordered" ? "text-emerald-700" : "text-amber-700"}`}>
                      {item.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          {/* Documents */}
          <section id="documents" className="scroll-mt-6 rounded-2xl border border-border bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ProjectSectionHeading eyebrow="Documents" title="Project files" />
              <button
                type="button"
                onClick={() => {
                  setUploadCategory("document");
                  setIsUploadOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#2a2a2a]"
              >
                + Upload file
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {documentsList.length === 0 ? (
                <DashboardState type="empty" title="No documents yet" description="Project files will appear here." />
              ) : (
                documentsList.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <ProjectFileIcon />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="mt-1 text-xs text-muted">
                        {item.type} · {item.date}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Payments */}
          <section id="payments" className="scroll-mt-6 rounded-2xl border border-border bg-white p-5">
            <ProjectSectionHeading eyebrow="Payments" title="Account summary" action="View payments" />
            {project.outstandingPayment > 0 ? (
              <>
                <p className="mt-5 text-2xl font-semibold">
                  ₹{project.outstandingPayment.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-sm text-muted">Outstanding balance</p>
              </>
            ) : (
              <div className="mt-5">
                <DashboardState type="empty" title="No outstanding payments" description="Your payment summary will appear here." />
              </div>
            )}
          </section>

          {/* Messages */}
          <section id="messages" className="scroll-mt-6 rounded-2xl border border-border bg-white p-5">
            <ProjectSectionHeading eyebrow="Messages" title="Project communication" action="Open messages" />
            <div className="mt-5">
              <DashboardState type="empty" title="No unread messages" description="Your project team will share updates here." />
            </div>
          </section>
        </div>

        {/* Support */}
        <section id="support" className="mt-6 scroll-mt-6 rounded-2xl border border-border bg-white p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <ProjectSectionHeading eyebrow="Support" title="Need help with this project?" />
              <p className="mt-2 text-sm text-muted">Your Buildora project team is here for questions, decisions, and updates.</p>
            </div>
            <Link
              href="/request-project"
              className="w-fit rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white"
            >
              Contact support
            </Link>
          </div>
        </section>
      </main>

      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        projectId={project.id}
        defaultCategory={uploadCategory}
        onUploadSuccess={(item) => {
          if (item.category === "blueprint") {
            setDesignsList((prev) => [
              { name: item.name, type: item.type, status: "Pending" },
              ...prev,
            ]);
          } else {
            setDocumentsList((prev) => [
              { name: item.name, type: item.type, date: item.date },
              ...prev,
            ]);
          }
        }}
      />
    </div>
  );
}
