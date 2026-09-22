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
    <section className="relative border-b border-[#e4dec8] bg-[#f8f6f0] py-16 lg:py-20">
      <Container>
        {/* Section Title Header */}
        <div className="flex flex-col justify-between gap-5 border-b border-[#e4dec8] pb-7 md:flex-row md:items-end md:pb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#c5a059]">
              Selected Works
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0e1319] sm:text-4xl lg:text-5xl">
              Architecture in practice.
            </h2>
          </div>
          <Link
            href="/projects"
            className="group inline-flex items-center gap-2 rounded-full border border-[#0e1319] bg-[#0e1319] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-md transition-all duration-300 hover:bg-[#c5a059] hover:text-[#0e1319]"
          >
            <span>View Full Portfolio</span>
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        {/* Portfolio Cards Grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {projects.map((project) => {
            const slug = getSlug(project.title);
            return (
              <article
                key={project.title}
                className="image-hover-glow card-hover-effect group relative overflow-hidden rounded-3xl border border-[#e4dec8] bg-white shadow-sm"
              >
                <div className="relative aspect-16/10 overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    quality={100}
                    className="relative z-0 object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:brightness-105 group-hover:saturate-110"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {/* Gradient Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e1319]/90 via-[#0e1319]/30 to-transparent transition-opacity duration-300 group-hover:opacity-85" />
                  
                  {/* Category Badge Top Left */}
                  <div className="absolute top-5 left-5">
                    <span className="rounded-full bg-white/90 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#0e1319] backdrop-blur shadow-sm">
                      {project.category}
                    </span>
                  </div>

                  {/* Bottom Overlay Content */}
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c5a059]">
                      {project.location}
                    </p>
                    <h3 className="mt-1 text-2xl font-bold tracking-tight text-white group-hover:text-[#e5c97d] transition-colors">
                      {project.title}
                    </h3>
                    <div className="mt-4 flex items-center justify-between border-t border-white/20 pt-4">
                      <span className="text-xs font-medium text-white/80">Completed Project</span>
                      <Link
                        href={`/projects/${slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white hover:text-[#c5a059]"
                      >
                        <span>View Details</span>
                        <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
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
