import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { getPublicProject } from "@/lib/public-data";

export function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return params.then(async ({ slug }) => {
    const project = await getPublicProject(slug);

    if (!project) {
      return { title: "Project Not Found" };
    }

    return {
      title: project.name,
      description: project.overview,
    };
  });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getPublicProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      <Section>
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">
              {project.category}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-primary sm:text-5xl">
              {project.name}
            </h1>
            <p className="mt-4 text-sm font-medium uppercase tracking-[0.14em] text-muted">
              {project.location}
            </p>
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="group rounded-[1.75rem] border border-border bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#c5a059]/60 hover:bg-[#fffdf8] hover:shadow-[0_14px_30px_-18px_rgba(197,160,89,0.55)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-primary">
                Project overview
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted">{project.overview}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {Object.entries(project.details).map(([key, value]) => (
                  <div key={key} className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{key}</p>
                    <p className="mt-2 text-sm font-medium text-primary">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="group rounded-[1.75rem] border border-border bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#c5a059]/60 hover:bg-[#fffdf8] hover:shadow-[0_14px_30px_-18px_rgba(197,160,89,0.55)] sm:p-8">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-primary">
                Scope of work
              </h2>
              <ul className="mt-6 space-y-4 text-sm leading-6 text-muted">
                {project.scope.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {project.gallery.length === 0 ? <p className="text-sm text-muted">No project media is available yet.</p> : project.gallery.map((image, index) => (
              <div key={`${project.slug}-${index}`} className="image-hover-glow group relative h-72 overflow-hidden rounded-3xl border border-border bg-white">
                <Image
                  src={image}
                  alt={`${project.name} gallery image ${index + 1}`}
                  fill
                  quality={100}
                  className="relative z-0 object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-105 group-hover:saturate-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="rounded-4xl border border-border bg-primary p-8 text-white sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/70">
                  Start a similar project
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-white">
                  Let’s discuss what you want to build or transform.
                </h2>
              </div>
              <Link
                href="/request-project"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-stone-100"
              >
                Request a Project
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
