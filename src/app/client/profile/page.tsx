import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/server";
import { DashboardIcon } from "@/components/client/dashboard-icons";
import { ClientProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "My profile — Buildora",
  description: "Manage your Buildora client profile.",
};

export default async function ClientProfilePage() {
  const user = await requireRole("customer");

  return (
    <main className="min-h-screen bg-[#f0ede7] text-primary">
      <header className="border-b border-border bg-[#f8f6f0]">
        <div className="mx-auto flex h-[4.5rem] max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/client/dashboard" className="flex items-center gap-3 font-semibold uppercase tracking-[0.16em]">
            <span className="gold-gradient-bg flex h-9 w-9 items-center justify-center rounded-lg text-xs font-black shadow-sm">B</span>
            Buildora
          </Link>
          <Link href="/client/dashboard" className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold transition-colors hover:border-[#c5a059]">
            <DashboardIcon name="grid" className="h-4 w-4" />
            <span>Back to dashboard</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a98032]">Account settings</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">My profile</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Manage the name shown to your Buildora project team and review the email connected to your account.</p>
        </div>

        <section className="overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-[0_16px_45px_-32px_rgba(14,19,25,0.45)]">
          <div className="border-b border-border bg-[#fffdf8] p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#e5c875] text-lg font-bold text-primary">
                {user.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "C"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{user.name}</p>
                <p className="mt-1 truncate text-sm text-muted">{user.email}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#a98032]">Buildora client</p>
              </div>
            </div>
          </div>
          <ClientProfileForm name={user.name} email={user.email} />
        </section>
      </div>
    </main>
  );
}
