import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { getProcessSteps } from "@/lib/data-access";

export const metadata: Metadata = {
  title: "Process",
  description:
    "Understand Buildora’s step-by-step process from consultation and design to construction, quality checks, and handover.",
};

const descriptions = [
  "We begin with a conversation to understand the site, project goals, and practical requirements before moving forward.",
  "We assess the brief, define the scope, and map out the sequence of design and execution decisions.",
  "The design direction is refined around function, layout, materials, and the overall lifestyle or business needs.",
  "We prepare a realistic estimate with the required scope, procurement view, and key milestones.",
  "Construction begins with careful coordination, contractor oversight, and quality-focused site leadership.",
  "We review workmanship, finishing quality, and key project details before final sign-off.",
  "The final walkthrough and handover process ensure the space is ready for move-in or operation.",
];

export default function ProcessPage() {
  const processSteps = getProcessSteps();

  return (
    <>
      <Section className="relative isolate overflow-hidden bg-[#f3efe5] py-20 sm:py-28">
        <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-[#c5a059]/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-[#d9e2e3]/70 blur-3xl" />
        <Container>
          <div className="relative grid gap-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#c5a059]/40 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#a98032] shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#c5a059] shadow-[0_0_14px_#c5a059]" />
                How we work
              </div>
              <h1 className="mt-6 text-5xl font-extrabold leading-[1.02] tracking-[-0.06em] text-primary sm:text-6xl">
                A clear path to a <span className="gold-gradient-text">confident build.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                From the first conversation to final handover, Buildora keeps every decision visible, practical, and connected to the space you want to create.
              </p>
            </div>
            <div className="rounded-3xl border border-primary/10 bg-white/60 p-6 shadow-sm backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a98032]">Our promise</p>
              <p className="mt-3 text-2xl font-bold tracking-tight text-primary">Clarity at every stage.</p>
              <div className="mt-5 h-1 w-full rounded-full bg-border">
                <div className="h-1 w-2/3 rounded-full bg-[#c5a059]" />
              </div>
              <p className="mt-3 text-xs text-muted">Design-led. Site-aware. Built to last.</p>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-[#f8f6f0] pt-10 sm:pt-14">
        <Container>
          <div className="relative space-y-4">
            <div className="absolute left-6 top-10 hidden h-[calc(100%-5rem)] w-px bg-linear-to-b from-[#c5a059] via-[#c5a059]/50 to-transparent md:block" />
            {processSteps.map((step, index) => (
              <article
                key={step}
                className="group relative grid gap-5 rounded-[1.75rem] border border-primary/10 bg-white/80 p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-[#c5a059]/60 hover:shadow-xl hover:shadow-[#c5a059]/10 md:grid-cols-[90px_1.1fr_2fr] md:items-center md:p-7"
              >
                <p className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-black tracking-[0.18em] text-white shadow-lg shadow-primary/15 transition-all duration-500 group-hover:bg-[#c5a059] group-hover:text-primary">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#a98032]">
                    Stage {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="text-xl font-bold tracking-[-0.04em] text-primary transition-colors group-hover:text-[#a98032]">
                    {step}
                  </h2>
                </div>
                <p className="text-sm leading-6 text-muted">{descriptions[index]}</p>
                <div className="absolute bottom-0 left-28 h-1 w-0 rounded-full bg-[#c5a059] transition-all duration-500 group-hover:w-24" />
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="relative overflow-hidden rounded-4xl border border-border bg-primary p-8 text-white shadow-2xl shadow-primary/15 sm:p-10">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#c5a059]/20 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#e5c875]">Ready when you are</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-white">
                  Let’s turn your brief into a build plan with confidence.
                </h2>
              </div>
              <Link
                href="/estimate"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-primary transition-all hover:-translate-y-1 hover:bg-[#e5c875]"
              >
                Start Your Estimate
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
