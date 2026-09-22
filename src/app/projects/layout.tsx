import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Explore Buildora residential, commercial, construction, interior, and renovation projects.",
};

export default function ProjectsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
