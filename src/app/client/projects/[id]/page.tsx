import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getClientProjectById } from "@/lib/data-access";
import { ProjectWorkspaceClient } from "@/components/client/project-workspace";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await getClientProjectById(id);
  return {
    title: project ? `${project.name} — Buildora` : "Project workspace — Buildora",
    description: "View your Buildora project progress, approvals, documents, and payments.",
  };
}

export default async function ClientProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getClientProjectById(id);

  if (!project) notFound();

  return <ProjectWorkspaceClient project={project} />;
}
