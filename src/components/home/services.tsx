import Link from "next/link";
import { Container } from "@/components/layout/container";
import { getHomeServices } from "@/lib/data-access";

const serviceSlugs: Record<string, string> = {
  "Architectural Design": "complete-home-construction",
  "Interior Design": "interior-design",
  "Construction Management": "commercial-construction",
  "Renovation & Turnkey Fit-Out": "renovation",
};

function getSlug(title: string) {
  return serviceSlugs[title] ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function Services() {
  const services = getHomeServices();

  return (
    <section className="relative border-b border-[#e4dec8] bg-white py-18 lg:py-24">
      <Container>
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-5 border-b border-[#e4dec8] pb-8 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c5a059]/35 bg-[#fffdf8] px-3.5 py-1 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#a98032] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c5a059]" />
              Capabilities &amp; Core Disciplines
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0a0e14] sm:text-4xl lg:text-5xl">
              End-to-end architectural mastery.
            </h2>
          </div>
          <Link
            href="/services"
            className="group inline-flex items-center gap-2 rounded-full border border-[#0a0e14] bg-[#0a0e14] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white shadow-md transition-all duration-300 hover:bg-[#c5a059] hover:text-[#0a0e14] hover:shadow-lg active:scale-95"
          >
            <span>View All Services</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* Services Cards Grid */}
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => {
            const slug = getSlug(service.title);
            return (
              <article
                key={service.title}
                className="group relative flex flex-col justify-between rounded-3xl border border-[#e4dec8] bg-[#f8f6f0] p-6 shadow-sm transition-all duration-400 hover:-translate-y-2 hover:border-[#c5a059] hover:bg-[#fffdf8] hover:shadow-[0_20px_40px_-20px_rgba(197,160,89,0.5)]"
              >
                {/* Technical Corner Marking */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-black tracking-widest text-[#a98032]">
                    [ 0{index + 1} ]
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#625d57]/60">
                    BIM.SPEC
                  </span>
                </div>

                {/* Title & Description */}
                <div className="mt-6 flex-1">
                  <h3 className="text-xl font-bold tracking-tight text-[#0a0e14] transition-colors duration-300 group-hover:text-[#a98032]">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#625d57]">
                    {service.description}
                  </p>
                </div>

                {/* Action Link */}
                <div className="mt-8 border-t border-[#e4dec8]/80 pt-4">
                  <Link
                    href={`/services/${slug}`}
                    className="group/link inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0a0e14] transition-colors group-hover:text-[#a98032]"
                  >
                    <span>Explore Service</span>
                    <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
