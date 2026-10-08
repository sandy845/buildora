import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/container";

export function Hero() {
  return (
    <section className="group relative isolate min-h-[82svh] overflow-hidden border-b border-[#e4dec8]/80 bg-[#0a0e14] lg:min-h-[78svh]">
      <Image
        src="/assets/images/buildora-hero-home.webp"
        alt="Buildora luxury modern architectural residence"
        fill
        className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
        sizes="100vw"
        quality={80}
        priority
      />
      {/* Cinematic Dual Vignette */}
      <div className="absolute inset-0 bg-linear-to-r from-[#0a0e14]/95 via-[#0a0e14]/70 to-[#0a0e14]/35" />
      <div className="absolute inset-0 bg-linear-to-t from-[#0a0e14]/90 via-transparent to-[#0a0e14]/30" />

      {/* Subtle Architectural Blueprint Grid */}
      <div className="tech-blueprint-grid-dark pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" aria-hidden="true" />

      {/* Technical Corner Crosshairs */}
      <div className="pointer-events-none absolute left-6 top-6 hidden font-mono text-[10px] tracking-widest text-[#e5c97d]/40 sm:block" aria-hidden="true">
        + 12.9716° N / 77.5946° E
      </div>
      <div className="pointer-events-none absolute right-6 top-6 hidden font-mono text-[10px] tracking-widest text-[#e5c97d]/40 sm:block" aria-hidden="true">
        SYS // BUILDORA_CAD.BIM.V2
      </div>

      <Container className="relative flex min-h-[82svh] items-center py-14 sm:py-20 lg:min-h-[78svh] lg:py-24">
        <div className="max-w-3xl">
          {/* Live Status Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#e5c875]/40 bg-[#0a0e14]/70 px-4 py-1.5 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-[#e5c875]/80">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e5c875] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e5c875]" />
            </span>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#e5c97d]">
              Live Engineering &amp; Client Tracking · 2026 / 2027
            </span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl lg:leading-[1.05]">
            Architectural distinction. <br />
            <span className="gold-gradient-text">Built to perfection.</span>
          </h1>

          {/* Description */}
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
            Buildora crafts bespoke luxury residences, modern commercial spaces, and turnkey interior environments with flawless architectural execution, BIM coordination, and absolute financial clarity.
          </p>

          {/* CTA Group */}
          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/estimate"
              className="group/cta inline-flex items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-[#0a0e14] shadow-2xl transition-all duration-300 hover:bg-[#c5a059] hover:text-[#0a0e14] hover:shadow-[#c5a059]/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Begin Your Project</span>
              <svg className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href="/projects"
              className="group/portfolio inline-flex items-center justify-center gap-2.5 rounded-full border border-white/30 bg-white/10 px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md transition-all duration-300 hover:border-[#c5a059] hover:bg-white/20 hover:text-white hover:shadow-lg active:scale-[0.98]"
            >
              <span>Explore Portfolio</span>
              <span className="text-[#e5c97d] transition-transform duration-300 group-hover/portfolio:translate-x-0.5">↗</span>
            </Link>
          </div>

          {/* Trust Metrics Bar */}
          <div className="mt-12 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/20 pt-7 sm:gap-8 sm:pt-8">
            <div className="relative">
              <span className="font-mono text-[10px] font-bold tracking-widest text-[#e5c97d]/75">01 // DELIVERED</span>
              <p className="mt-1 text-2xl font-black tracking-tight text-white lg:text-3xl">180+</p>
              <p className="mt-0.5 text-xs font-medium text-white/70">Projects Handed Over</p>
            </div>
            <div className="relative border-l border-white/15 pl-6 sm:pl-8">
              <span className="font-mono text-[10px] font-bold tracking-widest text-[#e5c97d]/75">02 // VALUATION</span>
              <p className="mt-1 text-2xl font-black tracking-tight text-white lg:text-3xl">₹48Cr+</p>
              <p className="mt-0.5 text-xs font-medium text-white/70">Managed Portfolio</p>
            </div>
            <div className="relative border-l border-white/15 pl-6 sm:pl-8">
              <span className="font-mono text-[10px] font-bold tracking-widest text-[#e5c97d]/75">03 // TIMELINE</span>
              <p className="mt-1 text-2xl font-black tracking-tight text-white lg:text-3xl">99.4%</p>
              <p className="mt-0.5 text-xs font-medium text-white/70">On-Time Execution</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
