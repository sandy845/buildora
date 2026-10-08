import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { getHomeProjects } from "@/lib/data-access";

function getSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function FeaturedProjects() {
  const projects = getHomeProjects();

  return (
    <section className="relative border-b border-[#e4dec8] bg-[#f8f6f0] py-18 lg:py-24">
      <Container>
        {/* Section Title Header */}
        <div className="flex flex-col justify-between gap-5 border-b border-[#e4dec8] pb-8 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c5a059]/35 bg-white px-3.5 py-1 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#a98032] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c5a059]" />
              Selected Portfolio // Architectural Works
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0a0e14] sm:text-4xl lg:text-5xl">
              Architecture in practice.
            </h2>
          </div>
          <Link
            href="/projects"
            className="group inline-flex items-center gap-2 rounded-full border border-[#0a0e14] bg-[#0a0e14] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-md transition-all duration-300 hover:bg-[#c5a059] hover:text-[#0a0e14] hover:shadow-lg active:scale-95"
          >
            <span>View Full Portfolio</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* Portfolio Cards Grid */}
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => {
            const slug = getSlug(project.title);
            return (
              <article
                key={project.title}
                className="group relative overflow-hidden rounded-3xl border border-[#e4dec8] bg-white shadow-sm transition-all duration-400 hover:-translate-y-2 hover:border-[#c5a059] hover:shadow-[0_24px_48px_-20px_rgba(197,160,89,0.5)]"
              >
                <div className="relative aspect-4/3 overflow-hidden bg-[#0a0e14]">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    quality={85}
                    className="relative z-0 object-cover transition-transform duration-700 ease-out group-hover:scale-108 group-hover:brightness-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  {/* Cinematic Vignette */}
                  <div className="absolute inset-0 bg-linear-to-t from-[#0a0e14]/90 via-[#0a0e14]/30 to-transparent transition-opacity duration-300 group-hover:opacity-80" />
                  
                  {/* Category Pill Top Left */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="rounded-full border border-white/30 bg-[#0a0e14]/60 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                      {project.category}
                    </span>
                  </div>

                  {/* Index Tag Top Right */}
                  <div className="absolute top-4 right-4 z-10">
                    <span className="rounded-full bg-white/90 px-2.5 py-1 font-mono text-[10px] font-black text-[#0a0e14] shadow-xs">
                      0{index + 1}
                    </span>
                  </div>

                  {/* Bottom Content Overlay */}
                  <div className="absolute bottom-5 left-5 right-5 z-10 text-white">
                    <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#e5c97d]">
                      {project.location}
                    </p>
                    <h3 className="mt-1 text-xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-[#e5c97d]">
                      {project.title}
                    </h3>
                    <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-3">
                      <span className="text-xs text-white/75">Execution Complete</span>
                      <Link
                        href={`/projects/${slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:text-[#e5c97d]"
                      >
                        <span>Details</span>
                        <span className="text-sm">↗</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
