import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account access",
  description: "Access your Buildora account and project workspace.",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
