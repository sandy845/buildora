import Link from "next/link";
import { Container } from "@/components/layout/container";

export function FinalCta() {
  return (
    <section id="start-project" className="relative overflow-hidden bg-[#f3efe5] py-20 lg:py-28">
      <Container>
        <div className="relative overflow-hidden rounded-4xl border border-[#c5a059]/40 bg-[#fffdf8] p-8 text-primary shadow-2xl shadow-[#c5a059]/10 sm:p-10 lg:p-14">
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#c5a059]/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-[#d9e2e3]/80 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#c5a059]/40 bg-[#f3efe5] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-[#a98032]">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#c5a059] shadow-[0_0_14px_#c5a059]" />
                Initiate your vision
              </div>
              <h2 className="mt-6 text-4xl font-extrabold leading-[1.02] tracking-tighter text-primary sm:text-5xl lg:text-6xl">
                Your next space starts with a <span className="gold-gradient-text">clear brief.</span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted">
                Tell us what you are building, how you want it to feel, and where you are in the process. Buildora will help shape the right design-and-build path.
              </p>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#c5a059]" /> Residential</span>
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#c5a059]" /> Commercial</span>
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#c5a059]" /> Interiors</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/estimate"
                className="gold-gradient-bg group inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[#0e1319] shadow-xl shadow-[#c5a059]/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-[#c5a059]/50"
              >
                <span>Build Your Estimate</span>
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
