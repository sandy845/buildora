import { DashboardIcon } from "@/components/client/dashboard-icons";

export function ProjectProgress({ value, className = "" }: { value: number; className?: string }) {
  return <div className={`h-2 overflow-hidden rounded-full bg-background ${className}`}><div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${value}%` }} /></div>;
}

export function ProjectStatus({ children = "On track" }: { children?: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />{children}</span>;
}

export function ProjectSectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: string }) {
  return <div className="flex items-start justify-between gap-4"><div>{eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{eyebrow}</p>}<h2 className={`${eyebrow ? "mt-2" : ""} text-xl font-semibold tracking-tight`}>{title}</h2></div>{action && <button type="button" className="shrink-0 text-sm font-semibold text-primary underline underline-offset-4">{action}</button>}</div>;
}

export function ProjectFileIcon({ name = "file" }: { name?: string }) {
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted"><DashboardIcon name={name} className="h-4 w-4" /></span>;
}
