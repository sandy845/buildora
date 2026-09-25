import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { getExpertise, getValues } from "@/lib/data-access";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Buildora’s approach to construction, interior design, and project delivery with clarity, accountability, and craft.",
};

export default function AboutPage() {
  const expertise = getExpertise();
  const values = getValues();
  return (
    <>
      <Section className="relative isolate overflow-hidden bg-[#f3efe5] py-16 text-primary sm:py-24 lg:py-28">
        <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#c5a059]/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-[#d9e2e3]/70 blur-3xl" />
        <Container>
          <div className="relative grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#c5a059]/40 bg-white/60 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#a98032] shadow-sm backdrop-blur">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#c5a059] shadow-[0_0_15px_#c5a059]" />
                <span>About Buildora</span>
              </div>
              <h1 className="mt-6 text-5xl font-extrabold leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                Spaces with <span className="gold-gradient-text">meaning.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-primary/65 sm:text-lg">
                Buildora helps homeowners and businesses shape spaces that feel considered, function smoothly, and stand the test of time. We combine architectural thinking with hands-on construction knowledge to deliver projects with clarity and confidence.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link href="/request-project" className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-xl transition-transform hover:-translate-y-1">
                  Start a conversation
                </Link>
                <Link href="/projects" className="rounded-full border border-primary/25 px-6 py-3 text-sm font-bold text-primary transition-colors hover:border-gold hover:text-[#a98032]">
                  View our work
                </Link>
              </div>
            </div>
            <div className="group relative mx-auto w-full max-w-lg">
              <div className="absolute -inset-5 rounded-[2.5rem] border border-[#e5c875]/20 animate-[spin_18s_linear_infinite]" />
              <div className="relative aspect-4/5 overflow-hidden rounded-4xl border border-white/80 bg-primary shadow-2xl shadow-primary/20 transition-all duration-700 ease-out group-hover:-translate-y-2 group-hover:shadow-[#c5a059]/30">
                <Image src="/assets/images/buildora-hero-home.webp" alt="Buildora contemporary architecture" fill quality={75} className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 group-hover:brightness-105 group-hover:saturate-110" sizes="(max-width: 1024px) 100vw, 45vw" />
                <div className="absolute inset-0 bg-linear-to-t from-primary/70 via-transparent to-transparent" />
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20 transition-colors duration-700 group-hover:ring-[#e5c875]/60" />
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/25 bg-primary/70 p-5 text-white backdrop-blur-md">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e5c875]">Our promise</p>
                  <p className="mt-2 text-lg font-bold text-white">Beautifully resolved. Built to last.</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="relative isolate overflow-hidden bg-[#f8f6f0] py-20">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-96 w-[50rem] rounded-full bg-gradient-to-b from-[#e5c875]/15 via-[#c5a059]/5 to-transparent blur-3xl" aria-hidden="true" />
        <Container>
          <div className="grid gap-7 md:grid-cols-3">
            {values.map((value, index) => (
              <article
                key={value.title}
                className="group relative overflow-hidden rounded-[2rem] border border-[#c5a059]/35 bg-white/40 p-8 shadow-lg shadow-[#c5a059]/5 backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2.5 hover:border-[#c5a059] hover:bg-white/75 hover:shadow-[0_20px_45px_-12px_rgba(197,160,89,0.3),0_0_28px_rgba(229,201,125,0.22)]"
              >
                {/* Golden ambient radial light */}
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-[#e5c875]/30 via-[#c5a059]/10 to-transparent blur-2xl transition-all duration-700 ease-out group-hover:scale-150 group-hover:from-[#e5c875]/50 group-hover:opacity-100"
                  aria-hidden="true"
                />

                <div className="relative flex items-center justify-between">
                  {/* Hollow gold number pill */}
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c5a059]/60 bg-gradient-to-br from-white/90 via-[#faf7ee]/80 to-[#e5c875]/20 font-mono text-base font-black text-[#9e7626] shadow-[0_2px_12px_rgba(197,160,89,0.15)] backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:border-[#c5a059] group-hover:shadow-[0_0_18px_rgba(229,201,125,0.45)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  
                  {/* Subtle golden status beacon */}
                  <span className="flex h-2.5 w-2.5 items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-[#c5a059]/50 transition-all duration-500 group-hover:scale-150 group-hover:bg-[#e5c875] group-hover:shadow-[0_0_10px_#e5c875]" />
                  </span>
                </div>

                <h2 className="relative mt-7 text-xl font-bold tracking-tight text-primary transition-colors duration-300 group-hover:text-[#9e7626]">
                  {value.title}
                </h2>
                
                <p className="relative mt-3 text-sm leading-relaxed text-muted">
                  {value.description}
                </p>

                {/* Animated expandable golden beam */}
                <div className="relative mt-7 h-1 w-12 rounded-full bg-gradient-to-r from-[#c5a059] via-[#e5c875] to-[#c5a059] transition-all duration-500 ease-out group-hover:w-full group-hover:shadow-[0_0_12px_rgba(229,201,125,0.8)]" />
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="relative overflow-hidden rounded-[2rem] border border-[#d9cba8] bg-[#fffdf8] shadow-xl shadow-[#c5a059]/10">
            <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[#e5c875]/20 blur-3xl" />
            <div className="relative grid lg:grid-cols-[0.9fr_1.1fr]">
              <div className="relative overflow-hidden bg-[#f3efe5] p-8 text-primary sm:p-10 lg:p-12">
                <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#d9e2e3]/70 blur-3xl" />
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#e5c875]/20 blur-3xl" />
                <div className="relative">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a98032]">Our expertise</p>
                <h2 className="mt-5 max-w-md text-3xl font-semibold leading-[1.08] tracking-[-0.06em] text-primary sm:text-4xl">
                  Knowledge that makes the difference on site.
                </h2>
                <p className="mt-6 max-w-sm text-sm leading-7 text-muted">
                  The right outcome comes from connecting design intent with practical build experience, from the first conversation to handover.
                </p>
                <div className="mt-10 flex items-center gap-3 border-t border-[#c5a059]/30 pt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  <span className="h-2 w-2 rounded-full bg-[#c5a059] shadow-[0_0_12px_#c5a059]" />
                  Design thinking meets delivery discipline
                </div>
                </div>
              </div>
              <div className="p-7 sm:p-10 lg:p-12">
                <div className="mb-7 flex items-center justify-between border-b border-border pb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a98032]">What we bring</p>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-muted">04 AREAS</span>
                </div>
                <ul className="divide-y divide-border">
                  {expertise.map((item, index) => (
                    <li key={item} className="group flex items-center gap-5 py-5 first:pt-0 last:pb-0">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#c5a059]/50 bg-[#f3efe5] text-xs font-bold text-[#a98032] transition-colors duration-300 group-hover:bg-[#e5c875] group-hover:text-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-base font-medium text-primary transition-transform duration-300 group-hover:translate-x-1 sm:text-lg">{item}</span>
                      <span className="ml-auto text-lg text-[#c5a059] opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" aria-hidden="true">↗</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="pt-0">
        <Container>
          <div className="rounded-4xl border border-border bg-white p-8 sm:p-10">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-3xl font-semibold tracking-[-0.06em] text-primary">180+</p>
                <p className="mt-2 text-sm text-muted">Project outcomes delivered</p>
              </div>
              <div>
                <p className="text-3xl font-semibold tracking-[-0.06em] text-primary">14 yrs</p>
                <p className="mt-2 text-sm text-muted">Hands-on build experience</p>
              </div>
              <div>
                <p className="text-3xl font-semibold tracking-[-0.06em] text-primary">96%</p>
                <p className="mt-2 text-sm text-muted">Based on referrals and repeat work</p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="rounded-4xl border border-border bg-primary p-8 text-white sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/70">Let’s talk</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-white">
                  Share your brief and we’ll help shape the right path forward.
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
