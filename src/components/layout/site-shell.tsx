"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/navigation/navbar";

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPrivateWorkspace = pathname.startsWith("/client/") || pathname.startsWith("/admin/");

  if (isPrivateWorkspace) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
