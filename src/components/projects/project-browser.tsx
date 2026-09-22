"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ProjectCard } from "@/components/projects/project-card";
import type { PublicProject } from "@/lib/public-data";

type ProjectBrowserProps = {
  projects: PublicProject[];
  categories: string[];
};

export function ProjectBrowser({ projects, categories }: ProjectBrowserProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const filteredProjects = useMemo(
    () => activeCategory === "All" ? projects : projects.filter((project) => project.category === activeCategory),
    [activeCategory, projects],
  );

  return (
    <>
      <Section>
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">Portfolio</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-primary sm:text-5xl">
              Selected work across homes, commercial spaces, and thoughtful transformations.
            </h1>
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <div className="flex flex-wrap gap-3">
            {["All", ...categories].map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === category
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white text-primary hover:border-primary"
                }`}
                aria-pressed={activeCategory === category}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => <ProjectCard key={project.slug} project={project} />)}
          </div>

          {filteredProjects.length === 0 && (
            <p className="mt-8 text-sm text-muted">No published projects are available for this category.</p>
          )}
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="rounded-4xl border border-border bg-primary p-8 text-white sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/70">Ready to begin?</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-white">Share your vision and let’s shape the next step together.</h2>
              </div>
              <Link href="/request-project" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-stone-100">Request a Project</Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
