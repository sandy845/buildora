import { listPortfolioProjectService, listServiceService } from "@/lib/services/core";
import { getServiceBySlug as getStaticServiceBySlug, services as staticServices } from "@/data/services";
import { getProjectBySlug as getStaticProjectBySlug, projects as staticProjects } from "@/data/projects";

export type PublicService = {
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  highlights: string[];
  include: string[];
};

export type PublicProject = {
  slug: string;
  name: string;
  category: string;
  location: string;
  overview: string;
  scope: string[];
  details: Record<string, string>;
  gallery: string[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toService(service: any): PublicService {
  const staticService = getStaticServiceBySlug(service.slug);
  return {
    slug: service.slug,
    title: service.name || service.title || "Service",
    shortDescription: service.shortDescription ?? staticService?.shortDescription ?? service.description ?? "",
    description: service.description || staticService?.description || "",
    highlights: staticService?.highlights ?? [],
    include: staticService?.include ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProject(project: any): PublicProject {
  return {
    slug: project.slug,
    name: project.name || project.title || "Project",
    category: project.serviceName ?? project.category ?? "Portfolio",
    location: project.location ?? "Buildora project",
    overview: project.description || "",
    scope: project.scope || [],
    details: {
      ...(project.completedAt ? { Completed: new Date(project.completedAt).toLocaleDateString() } : {}),
      ...(project.featured ? { Featured: "Selected work" } : {}),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gallery: (project.gallery || []).map((media: any) => (typeof media === "string" ? media : media.url)),
  };
}

export async function getPublicServices() {
  const services = await listServiceService({ where: { active: true }, orderBy: { name: "asc" } });
  return services.length > 0 ? services.map(toService) : staticServices;
}

export async function getPublicService(slug: string) {
  const services = await listServiceService({ where: { slug, active: true }, take: 1 });
  const service = services[0];
  return service ? toService(service) : getStaticServiceBySlug(slug) ?? null;
}

export async function getPublicProjects() {
  const projects = await listPortfolioProjectService({
    where: { published: true },
    include: { gallery: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
  return projects.length > 0 ? projects.map(toProject) : staticProjects;
}

export async function getPublicProject(slug: string) {
  const projects = await listPortfolioProjectService({
    where: { slug, published: true },
    include: { gallery: { orderBy: { sortOrder: "asc" } } },
    take: 1,
  });
  return projects[0] ? toProject(projects[0]) : getStaticProjectBySlug(slug) ?? null;
}
