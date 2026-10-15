import { DashboardIcon } from "@/components/client/dashboard-icons";

export function ProjectProgress({ value, className = "" }: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Project progress: ${clamped}%`}
      className={`h-2 overflow-hidden rounded-full bg-background ${className}`}
    >
      <div
        className="h-full rounded-full bg-amber-500 transition-all duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  on_track:    { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-600", label: "On track" },
  in_progress: { bg: "bg-amber-100",   text: "text-amber-800",   dot: "bg-amber-500",   label: "In progress" },
  planning:    { bg: "bg-blue-100",    text: "text-blue-800",    dot: "bg-blue-500",    label: "Planning" },
  on_hold:     { bg: "bg-orange-100",  text: "text-orange-800",  dot: "bg-orange-500",  label: "On hold" },
  delayed:     { bg: "bg-red-100",     text: "text-red-800",     dot: "bg-red-500",     label: "Delayed" },
  completed:   { bg: "bg-slate-100",   text: "text-slate-700",   dot: "bg-slate-500",   label: "Completed" },
};

export function ProjectStatus({ children = "on_track" }: { children?: string }) {
  const key = (children ?? "on_track").toLowerCase().replace(/\s+/g, "_");
  const cfg = statusConfig[key] ?? statusConfig.on_track;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${cfg.bg} ${cfg.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function ProjectSectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{eyebrow}</p>}
        <h2 className={`${eyebrow ? "mt-2" : ""} text-xl font-semibold tracking-tight`}>{title}</h2>
      </div>
      {action && (
        <button
          type="button"
          aria-label={action}
          className="shrink-0 text-sm font-semibold text-primary underline underline-offset-4 hover:text-[#a98032] transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  );
}

export function ProjectFileIcon({ name = "file" }: { name?: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted">
      <DashboardIcon name={name} className="h-4 w-4" />
    </span>
  );
}
