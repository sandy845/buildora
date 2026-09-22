import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { getPublicService, getPublicServices } from "@/lib/public-data";

export async function generateStaticParams() {
  const services = await getPublicServices();
  return services.map((service) => ({ slug: service.slug }));
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  return params.then(async ({ slug }) => {
    const service = await getPublicService(slug);

    if (!service) {
      return { title: "Service Not Found" };
    }

    return {
      title: service.title,
      description: service.shortDescription,
    };
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getPublicService(slug);

  if (!service) {
    notFound();
  }

  return (
    <>
      <Section className="pb-8 sm:pb-10">
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">Service</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-primary sm:text-5xl">
              {service.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              {service.description}
            </p>
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="group rounded-[1.75rem] border border-border bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#c5a059]/60 hover:bg-[#fffdf8] hover:shadow-[0_14px_30px_-18px_rgba(197,160,89,0.55)] sm:p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-primary">
              What this service includes
            </h2>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-muted">
              {service.include.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="group rounded-[1.75rem] border border-border bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#c5a059]/60 hover:bg-[#fffdf8] hover:shadow-[0_14px_30px_-18px_rgba(197,160,89,0.55)] sm:p-8">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">
              Key strengths
            </p>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-muted">
              {service.highlights.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="rounded-4xl border border-border bg-primary p-8 text-white sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/70">
                  Ready to begin?
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-white">
                  Discuss your {service.title.toLowerCase()} requirements.
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
