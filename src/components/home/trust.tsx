import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { getTrustStats } from "@/lib/data-access";

export function Trust() {
  const trustStats = getTrustStats();
  return (
    <section className="relative border-b border-[#e4dec8] bg-[#f8f6f0] py-10 lg:py-14">
      <Container>
        <div className="grid gap-5 md:grid-cols-3">
          {trustStats.map((item, index) => (
            <div
              key={item.label}
              className="group relative overflow-hidden rounded-3xl border border-[#e4dec8] bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#c5a059]/60 hover:shadow-[0_16px_32px_-16px_rgba(197,160,89,0.35)]"
            >
              {/* Subtle architectural background corner grid */}
              <div className="tech-dots-bg pointer-events-none absolute right-0 top-0 h-24 w-24 opacity-40 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
              
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#a98032]">
                  SPEC 0{index + 1} //
                </span>
                <span className="inline-flex h-2 w-2 rounded-full bg-[#c5a059] opacity-75 ring-4 ring-[#c5a059]/20" />
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <p className="text-4xl font-extrabold tracking-tight text-[#0a0e14] lg:text-5xl">
                  {item.value}
                </p>
              </div>

              <p className="mt-2 text-sm font-medium leading-relaxed text-[#625d57]">
                {item.label}
              </p>

              {/* Bottom active indicator */}
              <div className="mt-5 h-0.5 w-8 rounded-full bg-[#c5a059]/40 transition-all duration-300 group-hover:w-full group-hover:bg-[#c5a059]" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
