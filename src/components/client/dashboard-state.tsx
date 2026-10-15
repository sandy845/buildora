import Link from "next/link";

type DashboardStateProps = {
  type: "loading" | "empty" | "error";
  title: string;
  description: string;
  action?: string | { label: string; href?: string; onClick?: () => void };
};

export function DashboardState({ type, title, description, action }: DashboardStateProps) {
  return (
    <div
      className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-[#d9cba8] bg-[#faf8f3] px-6 py-8 text-center"
      aria-live="polite"
    >
      <div>
        {type === "loading" ? (
          <span
            aria-label="Loading"
            className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
          >
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d9cba8] border-t-[#a98032]" />
          </span>
        ) : type === "error" ? (
          <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-red-600 shadow-sm">
            !
          </span>
        ) : (
          <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-muted shadow-sm">
            —
          </span>
        )}
        <p className="mt-3 text-sm font-semibold text-primary">{title}</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-muted">{description}</p>
        {action && (
          typeof action === "string" ? (
            <button type="button" className="mt-3 text-xs font-semibold text-primary underline underline-offset-4 hover:text-[#a98032] transition-colors">
              {action}
            </button>
          ) : action.href ? (
            <Link
              href={action.href}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#c5a059] bg-[#fffdf8] px-4 py-2 text-xs font-bold text-primary shadow-xs transition-all hover:bg-[#c5a059] hover:text-primary hover:shadow-md"
            >
              {action.label} →
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="mt-3 text-xs font-semibold text-primary underline underline-offset-4 hover:text-[#a98032] transition-colors"
            >
              {action.label}
            </button>
          )
        )}
      </div>
    </div>
  );
}

