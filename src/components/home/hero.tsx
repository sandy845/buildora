import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/container";

export function Hero() {
  return (
    <section className="group relative isolate min-h-[78svh] overflow-hidden border-b border-[#e4dec8] bg-[#0e1319] lg:min-h-[74svh]">
      <Image
        src="/assets/images/buildora-hero-home.webp"
        alt="Premium contemporary living room interior"
        fill
        className="object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-110"
        sizes="100vw"
        quality={75}
        priority
      />
      <div className="absolute inset-0 bg-linear-to-r from-[#0e1319]/90 via-[#0e1319]/55 to-[#0e1319]/20" />
      <div className="absolute inset-0 bg-linear-to-t from-[#0e1319]/75 via-transparent to-[#0e1319]/20" />

      <Container className="relative flex min-h-[78svh] items-center py-12 sm:py-16 lg:min-h-[74svh] lg:py-20">
        <div className="max-w-3xl">
          {/* Live Status Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-[#e5c875]/50 bg-[#0e1319]/60 px-4 py-1.5 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e5c875] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#e5c875]" />
            </span>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-white">
              Accepting Select Projects · 2026 / 2027
            </span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-7xl lg:leading-[1.08]">
            Architectural distinction. <br />
            <span className="gold-gradient-text">Built to perfection.</span>
          </h1>

          {/* Description */}
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            Buildora crafts bespoke luxury residences, modern commercial spaces, and turnkey interior environments with flawless architectural execution and complete financial transparency.
          </p>

          {/* CTA Group */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href="/estimate"
              className="group/cta inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-[#0e1319] shadow-xl transition-all duration-300 hover:bg-[#c5a059] hover:shadow-[#c5a059]/30 hover:scale-[1.02]"
            >
              <span>Begin Your Project</span>
              <svg className="h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href="/projects"
              className="group/portfolio inline-flex items-center justify-center gap-2 rounded-full border border-white/50 bg-white/10 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur transition-all duration-300 hover:border-[#c5a059] hover:bg-white hover:text-[#0e1319] hover:shadow-md"
            >
              <span>Explore Portfolio</span>
            </Link>
          </div>

          {/* Trust Metrics Bar */}
          <div className="mt-10 grid max-w-2xl grid-cols-3 gap-5 border-t border-white/30 pt-6 sm:gap-6 sm:pt-7">
            <div>
              <p className="text-2xl font-black tracking-tight text-white lg:text-3xl">120+</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/75">Projects Completed</p>
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-white lg:text-3xl">₹45M+</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/75">Portfolio Value</p>
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-white lg:text-3xl">99.4%</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/75">On-Time Delivery</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
