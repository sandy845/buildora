type DashboardStateProps = {
  type: "loading" | "empty" | "error";
  title: string;
  description: string;
  action?: string;
};

export function DashboardState({ type, title, description, action }: DashboardStateProps) {
  const icon = type === "loading" ? "..." : type === "error" ? "!" : "-";

  return (
    <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-border bg-background px-6 py-8 text-center">
      <div>
        <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-muted shadow-sm">{icon}</span>
        <p className="mt-3 text-sm font-semibold text-primary">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
        {action && <button type="button" className="mt-3 text-xs font-semibold text-primary underline underline-offset-4">{action}</button>}
      </div>
    </div>
  );
}
