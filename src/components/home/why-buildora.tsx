import { Container } from "@/components/layout/container";
import { getReasons } from "@/lib/data-access";

export function WhyBuildora() {
  const reasons = getReasons();

  return (
    <section id="about" className="about-section relative isolate overflow-hidden border-b border-[#e4dec8] bg-[#0e1319] py-20 text-white lg:py-28">
      <div className="about-glow about-glow-one" aria-hidden="true" />
      <div className="about-glow about-glow-two" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(229,201,125,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(229,201,125,0.12)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />

      <Container>
        <div className="relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-[#e5c875]/30 bg-white/[0.06] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-[#e5c875] backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#e5c875] shadow-[0_0_16px_#e5c875]" />
              The Buildora Advantage
            </div>
            <h2 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Confidence built into every square foot.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
              We bridge high-end architectural design with rigorous engineering and live client tracking, so every decision feels as considered as the finished space.
            </p>
          </div>

          <div className="relative hidden min-h-40 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] p-7 shadow-2xl shadow-black/20 lg:block">
            <div className="absolute -right-8 -top-16 h-44 w-44 rounded-full bg-[#c5a059]/20 blur-3xl" />
            <p className="relative text-sm font-semibold uppercase tracking-[0.18em] text-white/50">The standard</p>
            <p className="relative mt-3 max-w-md text-2xl font-bold tracking-tight text-white">
              Clear process. Elevated detail. No compromises.
            </p>
            <div className="relative mt-6 h-px w-full bg-gradient-to-r from-[#e5c875] to-transparent" />
          </div>
        </div>

        <div className="relative mt-12 grid gap-5 md:grid-cols-3">
          {reasons.map((reason, index) => (
            <article
              key={reason.title}
              className="about-card group relative overflow-hidden rounded-[2rem] border border-[#e5c875]/20 bg-white/[0.04] p-8 shadow-2xl shadow-black/20 backdrop-blur-md transition-all duration-500 ease-out hover:-translate-y-2.5 hover:border-[#e5c875]/70 hover:bg-white/[0.08] hover:shadow-[0_20px_45px_-10px_rgba(229,201,125,0.22)]"
            >
              {/* Golden light glow on hover */}
              <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-gradient-to-br from-[#e5c875]/25 via-[#c5a059]/10 to-transparent blur-2xl transition-all duration-700 ease-out group-hover:scale-150 group-hover:from-[#e5c875]/45 group-hover:opacity-100" />
              
              <div className="relative flex items-center justify-between">
                {/* Hollow gold number pill */}
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e5c875]/50 bg-gradient-to-br from-[#e5c875]/20 via-white/[0.05] to-transparent font-mono text-base font-black text-[#e5c875] shadow-lg shadow-[#c5a059]/15 backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:border-[#e5c875] group-hover:shadow-[0_0_20px_rgba(229,201,125,0.4)]">
                  {String(index + 1).padStart(2, "0")}
                </div>
                
                {/* Subtle golden beacon */}
                <span className="flex h-2.5 w-2.5 items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-[#e5c875]/40 transition-all duration-500 group-hover:scale-150 group-hover:bg-[#e5c875] group-hover:shadow-[0_0_10px_#e5c875]" />
                </span>
              </div>
              
              <h3 className="relative mt-7 text-xl font-bold tracking-tight text-white transition-colors duration-300 group-hover:text-[#e5c875]">
                {reason.title}
              </h3>
              <p className="relative mt-3 text-sm leading-relaxed text-white/65">
                {reason.description}
              </p>
              
              {/* Expanding golden accent bar */}
              <div className="relative mt-7 h-1 w-12 rounded-full bg-gradient-to-r from-[#c5a059] via-[#e5c875] to-[#c5a059] transition-all duration-500 ease-out group-hover:w-full group-hover:shadow-[0_0_12px_rgba(229,201,125,0.7)]" />
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
