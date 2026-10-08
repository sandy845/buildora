import Link from "next/link";
import { Container } from "@/components/layout/container";

export function FinalCta() {
  return (
    <section id="start-project" className="relative overflow-hidden bg-[#f3efe5] py-20 lg:py-28">
      <Container>
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[#c5a059]/50 bg-[#0a0e14] p-8 text-white shadow-2xl shadow-black/30 sm:p-12 lg:p-16">
          {/* Subtle blueprint grid */}
          <div className="tech-blueprint-grid-dark pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          
          {/* Ambient Gold Glows */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#c5a059]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-[#e5c97d]/15 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#e5c97d]/35 bg-white/10 px-4 py-1.5 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e5c875] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e5c875]" />
                </span>
                <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#e5c97d]">
                  Initiate Your Project Brief
                </span>
              </div>

              <h2 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Your next space starts with a <br />
                <span className="gold-gradient-text">clear brief.</span>
              </h2>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80">
                Tell us what you are building, how you want it to feel, and where you are in the planning cycle. Buildora engineers and architects will shape the right design-and-build trajectory.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {["Residential Villas", "Commercial Workspaces", "Turnkey Interiors", "Full Renovation"].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-white/70"
                  >
                    <span className="h-1 w-1 rounded-full bg-[#c5a059]" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3.5 sm:flex-row">
              <Link
                href="/estimate"
                className="gold-gradient-bg group inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[#0a0e14] shadow-xl shadow-[#c5a059]/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-[#c5a059]/50 active:scale-95"
              >
                <span>Build Your Estimate</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/request-project"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md transition-all duration-300 hover:border-[#c5a059] hover:bg-white/20 active:scale-95"
              >
                <span>Request Project</span>
                <span className="text-[#e5c97d] transition-transform duration-300 group-hover:translate-x-0.5">↗</span>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
