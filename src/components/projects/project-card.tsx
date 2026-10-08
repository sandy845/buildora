import Image from "next/image";
import Link from "next/link";
import type { PublicProject } from "@/lib/public-data";

type ProjectCardProps = {
  project: PublicProject;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border border-[#e4dec8] bg-white shadow-sm transition-all duration-400 hover:-translate-y-2 hover:border-[#c5a059] hover:shadow-[0_24px_48px_-20px_rgba(197,160,89,0.45)]">
      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#0a0e14]">
        <Image
          src={project.gallery[0] ?? "/file.svg"}
          alt={project.name}
          fill
          quality={85}
          className="relative z-0 object-cover transition-transform duration-700 ease-out group-hover:scale-108 group-hover:brightness-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Subtle Gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-[#0a0e14]/75 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-60" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 z-10">
          <span className="rounded-full border border-white/30 bg-[#0a0e14]/65 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
            {project.category}
          </span>
        </div>
        <div className="absolute top-4 right-4 z-10">
          <span className="rounded-full bg-white/90 px-2.5 py-1 font-mono text-[10px] font-bold text-[#0a0e14] shadow-xs">
            {project.location}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#0a0e14] transition-colors duration-300 group-hover:text-[#a98032]">
            {project.name}
          </h2>
          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-[#625d57]">{project.overview}</p>
        </div>

        <div className="mt-6 border-t border-[#e4dec8]/80 pt-4">
          <Link
            href={`/projects/${project.slug}`}
            className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#0a0e14] transition-colors group-hover:text-[#a98032]"
          >
            <span>View Project Dossier</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
