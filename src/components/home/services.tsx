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
    <section className="relative border-b border-[#e4dec8] bg-white py-16 lg:py-20">
      <Container>
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-5 border-b border-[#e4dec8] pb-7 sm:flex-row sm:items-end sm:pb-8">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#c5a059]">
              Capabilities & Offerings
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-[#0e1319] sm:text-4xl lg:text-5xl">
              End-to-end architectural mastery.
            </h2>
          </div>
          <Link
            href="/services"
            className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0e1319] transition-colors hover:text-[#c5a059]"
          >
            <span>View All Services</span>
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        {/* Services Cards Grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => {
            const slug = getSlug(service.title);
            return (
              <article
                key={service.title}
                className="card-hover-effect group relative flex flex-col justify-between rounded-3xl border border-[#e4dec8] bg-[#f8f6f0] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#c5a059]/60 hover:bg-[#fffdf8] hover:shadow-[0_14px_30px_-18px_rgba(197,160,89,0.55)]"
              >
                <div>
                  {/* Index Counter */}
                  <div className="flex items-center justify-between">
                    <span className="gold-gradient-text text-xl font-black tracking-widest">
                      0{index + 1}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="mt-5 text-2xl font-bold tracking-tight text-[#0e1319] transition-colors group-hover:text-[#c5a059]">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#625d57]">
                    {service.description}
                  </p>
                </div>

                {/* Action Link */}
                <div className="mt-6 border-t border-[#e4dec8]/80 pt-5">
                  <Link
                    href={`/services/${slug}`}
                    className="group/link inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0e1319] transition-colors group-hover:text-[#c5a059]"
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
