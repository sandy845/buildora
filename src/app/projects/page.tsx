import { ProjectBrowser } from "@/components/projects/project-browser";
import { getPublicProjects } from "@/lib/public-data";

export default async function ProjectsPage() {
  const projects = await getPublicProjects();
  const categories = [...new Set(projects.map((project) => project.category))];
  return <ProjectBrowser projects={projects} categories={categories} />;
}
