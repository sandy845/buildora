import Image from "next/image";
import Link from "next/link";
import type { PublicProject } from "@/lib/public-data";

type ProjectCardProps = {
  project: PublicProject;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="image-hover-glow group overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm">
      <div className="relative h-72 w-full">
        <Image
          src={project.gallery[0] ?? "/file.svg"}
          alt={project.name}
          fill
          quality={75}
          className="relative z-0 object-cover transition-transform duration-500 group-hover:scale-110 group-hover:brightness-105 group-hover:saturate-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.14em] text-muted">
          <span>{project.category}</span>
          <span>{project.location}</span>
        </div>

        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-primary">
          {project.name}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">{project.overview}</p>

        <Link
          href={`/projects/${project.slug}`}
          className="mt-6 inline-flex items-center text-sm font-medium text-primary hover:text-muted"
        >
          View project
        </Link>
      </div>
    </article>
  );
}
