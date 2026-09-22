import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Customer workspace",
  description: "Review your Buildora projects, approvals, documents, and payments.",
};

export default async function ClientLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireRole("customer");
  return children;
}