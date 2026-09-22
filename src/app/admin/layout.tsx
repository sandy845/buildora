import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Admin dashboard",
  description: "Buildora operations and project management dashboard.",
};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await requireRole("admin");
  return children;
}