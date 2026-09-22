import Link from "next/link";
import { DashboardIcon } from "@/components/client/dashboard-icons";
import { getClientDashboardDataServer } from "@/lib/data-access";
import { ClientDashboardClient } from "./page.client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Customer dashboard — Buildora",
  description: "Review your Buildora projects, approvals, documents, and payments.",
};

export default async function ClientDashboardPage() {
  const data = await getClientDashboardDataServer();

  return (
    <div className="min-h-screen bg-[#f0ede7] text-primary">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-white lg:flex">
        <DashboardBrand />
        <DashboardNavigation navItems={data.navItems} />
        <details className="group relative mt-auto border-t border-border bg-[#faf8f3] p-4">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-[#f3efe5] [&::-webkit-details-marker]:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e5c875] text-xs font-black text-primary shadow-sm transition-transform duration-300 group-hover:scale-105">
              CP
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-primary">Customer account</p>
              <p className="truncate text-xs text-muted">Buildora workspace</p>
            </div>
            <span className="text-muted transition-transform duration-300 group-open:rotate-180" aria-hidden="true">⌄</span>
          </summary>
          <div className="absolute bottom-[calc(100%-0.25rem)] left-4 right-4 z-50 rounded-2xl border border-[#d9cba8] bg-[#fffdf8] p-2 shadow-xl shadow-primary/10">
            <div className="border-b border-border px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a98032]">Account menu</p>
              <p className="mt-1 text-xs text-muted">Manage your client access</p>
            </div>
            <Link href="/client/dashboard#profile" className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-[#f3efe5]">
              <span className="text-[#a98032]">○</span> View profile
            </Link>
            <Link href="/client/dashboard#settings" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-[#f3efe5]">
              <span className="text-[#a98032]">⚙</span> Edit profile
            </Link>
            <Link href="/auth/login" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-red-50 hover:text-red-700">
              <span>↗</span> Sign out
            </Link>
          </div>
        </details>
      </aside>

      <div className="lg:pl-64">
        <ClientDashboardClient
          navItems={data.navItems}
          stats={data.stats}
          projects={data.projects}
          activity={data.activity}
          quotations={data.quotations}
          documents={data.documents}
          messages={data.messages}
          notifications={data.notifications}
          account={data.account}
        />
      </div>
    </div>
  );
}

function DashboardBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/client/dashboard"
      className={`flex items-center gap-2.5 ${compact ? "text-sm" : "px-5 py-7 text-base"} font-semibold uppercase tracking-[0.18em] text-primary`}
    >
      <span className="gold-gradient-bg flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-primary shadow-md shadow-[#c5a059]/20">B</span>
      Buildora
    </Link>
  );
}

function DashboardNavigation({
  navItems,
  onNavigate,
}: {
  navItems: { label: string; href: string; icon: string; count?: number }[];
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 overflow-y-auto px-3">
      {navItems.map((item, index) => (
        <Link
          key={item.label}
          href={item.href}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${index === 0 ? "bg-primary text-white" : "text-muted hover:bg-background hover:text-primary"}`}
        >
          <DashboardIcon name={item.icon} className="h-5 w-5" />
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
