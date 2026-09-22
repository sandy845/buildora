import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ServiceCard } from "@/components/services/service-card";
import { getPublicServices } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Services",
  description: "Explore Buildora construction, interior design, renovation, and planning services.",
};

export default async function ServicesPage() {
  const services = await getPublicServices();
  return (
    <>
      <Section className="relative isolate overflow-hidden bg-[#f3efe5] py-16 sm:py-24 lg:py-28">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[30rem] w-[30rem] rounded-full bg-[#c5a059]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-[#d9e2e3]/80 blur-3xl" />
        <Container>
          <div className="relative grid items-end gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#c5a059]/40 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#a98032] shadow-sm backdrop-blur">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#c5a059] shadow-[0_0_14px_#c5a059]" />
                What we do
              </div>
              <h1 className="mt-6 text-5xl font-extrabold leading-[0.98] tracking-[-0.07em] text-primary sm:text-6xl lg:text-7xl">
                Spaces made <span className="gold-gradient-text">considered.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-primary/65 sm:text-lg">
                From structural construction to considered interiors, Buildora brings design thinking and disciplined delivery together.
              </p>
            </div>
            <div className="approach-card-wrap relative">
              <div className="approach-blueprint pointer-events-none absolute -inset-8 hidden sm:block" aria-hidden="true">
                <span className="approach-blueprint-line approach-blueprint-line-one" />
                <span className="approach-blueprint-line approach-blueprint-line-two" />
                <span className="approach-blueprint-corner approach-blueprint-corner-one" />
                <span className="approach-blueprint-corner approach-blueprint-corner-two" />
                <span className="approach-blueprint-node approach-blueprint-node-one" />
                <span className="approach-blueprint-node approach-blueprint-node-two" />
              </div>
              <div className="group relative z-10 isolate overflow-hidden rounded-[2rem] border border-[#c5a059]/45 bg-[#fffdf8] p-7 text-primary shadow-2xl shadow-[#c5a059]/20 sm:p-9">
              <div className="approach-grid pointer-events-none absolute inset-0 opacity-40" />
              <div className="approach-glow pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#e5c875]/25 blur-3xl" />
              <div className="pointer-events-none absolute -right-7 top-7 h-28 w-28 rounded-full border border-[#c5a059]/45">
                <span className="approach-orbit absolute -left-1 top-1/2 h-2 w-2 rounded-full bg-[#b88e38] shadow-[0_0_14px_#c5a059]" />
              </div>
              <div className="pointer-events-none absolute right-7 top-7 h-28 w-28 scale-75 rounded-full border border-[#c5a059]/20" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a98032]">Our approach</p>
                  <span className="font-mono text-[10px] tracking-[0.22em] text-primary/35">BD / 01</span>
                </div>
                <p className="mt-7 max-w-xl text-2xl font-semibold leading-[1.12] tracking-[-0.05em] sm:text-3xl">
                  Thoughtful planning. Precise execution. A better everyday space.
                </p>
                <div className="mt-8 flex items-center gap-4 border-t border-primary/15 pt-5">
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#c5a059]/65">
                    <span className="h-2 w-2 rounded-full bg-[#c5a059]" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a98032]">The Buildora method</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">Built around how you live and work</p>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-[#f8f6f0] pt-12 sm:pt-16">
        <Container>
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a98032]">Our capabilities</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-primary sm:text-4xl">A complete view of your project.</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted">One considered partner from the first sketch to the final detail.</p>
          </div>
          {services.length === 0 ? <p className="text-sm text-muted">No services are available right now.</p> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{services.map((service, index) => <ServiceCard key={service.slug} service={service} index={index} />)}</div>}
        </Container>
      </Section>

      <Section className="pt-4 sm:pt-8">
        <Container>
          <div className="relative overflow-hidden rounded-[2rem] bg-primary p-8 text-white shadow-2xl shadow-primary/15 sm:p-12">
            <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border border-[#e5c875]/20" />
            <div className="pointer-events-none absolute -right-2 -top-14 h-48 w-48 rounded-full border border-[#e5c875]/15" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e5c875]">Have a project in mind?</p>
                <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.06em] sm:text-4xl">Let’s plan the right next step.</h2>
                <p className="mt-4 text-sm leading-6 text-white/65">Tell us what you are building, transforming, or imagining. We’ll help you find the clearest way forward.</p>
              </div>
              <Link href="/request-project" className="group inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-primary transition-all duration-300 hover:-translate-y-1 hover:bg-[#e5c875] hover:shadow-xl">
                Request a Project <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
