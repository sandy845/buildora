import Link from "next/link";
import { AdminIcon } from "@/components/admin/admin-icons";
import { getAdminDashboardDataServer } from "@/lib/data-access";
import { AdminDashboardClient } from "./page.client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardDataServer();

  return (
    <div className="min-h-screen bg-[#f0ede7] text-primary">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-white lg:flex">
        <AdminBrand />
        <AdminNavigation navItems={data.navItems} />
        <AdminProfile />
      </aside>

      <div className="lg:pl-64">
        <AdminDashboardClient
          navItems={data.navItems}
          stats={data.stats}
          projects={data.projects}
          leads={data.leads}
          activity={data.activity}
          finance={data.finance}
          reports={data.reports}
          calendar={data.calendar}
          customers={data.customers}
        />
      </div>
    </div>
  );
}

function AdminBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/admin/dashboard"
      className={`flex items-center gap-2.5 ${compact ? "text-sm" : "px-5 py-7 text-base"} font-semibold uppercase tracking-[0.18em]`}
    >
      <span className="gold-gradient-bg flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-primary shadow-md shadow-[#c5a059]/20">B</span>
      Buildora
    </Link>
  );
}

function AdminNavigation({
  navItems,
}: {
  navItems: { label: string; href: string; icon: string; count?: number }[];
}) {
  return (
    <div className="flex flex-col gap-1 overflow-y-auto px-3">
      {navItems.map((item, index) => (
        <Link
          key={item.label}
          href={item.href}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${index === 0 ? "bg-primary text-white" : "text-muted hover:bg-background hover:text-primary"}`}
        >
          <AdminIcon name={item.icon} className="h-5 w-5" />
          <span className="flex-1">{item.label}</span>
          {item.count && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${index === 0 ? "bg-white/15 text-white" : "bg-amber-100 text-amber-800"}`}
            >
              {item.count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

function AdminProfile() {
  return (
    <div className="mt-auto border-t border-border p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">AD</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Admin workspace</p>
          <p className="truncate text-xs text-muted">Operations team</p>
        </div>
        <button type="button" aria-label="Open admin account menu" className="ml-auto text-muted">
          ...
        </button>
      </div>
    </div>
  );
}
