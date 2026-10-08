import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { getTestimonials } from "@/lib/data-access";

export function Testimonials() {
  const testimonials = getTestimonials();
  return (
    <section className="relative border-b border-[#e4dec8] bg-white py-18 lg:py-24">
      <Container>
        <div className="flex flex-col justify-between gap-5 border-b border-[#e4dec8] pb-8 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#c5a059]/35 bg-[#fffdf8] px-3.5 py-1 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#a98032] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c5a059]" />
              Verified Client Outcomes // Advocacy
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0a0e14] sm:text-4xl lg:text-5xl">
              Trusted by homeowners &amp; businesses.
            </h2>
          </div>
          <p className="max-w-md text-sm text-[#625d57]">
            Direct feedback from clients who demand architectural clarity, meticulous budgeting, and spotless site handover.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <article
              key={testimonial.name}
              className="group relative flex flex-col justify-between rounded-3xl border border-[#e4dec8] bg-[#f8f6f0] p-7 shadow-sm transition-all duration-400 hover:-translate-y-2 hover:border-[#c5a059] hover:bg-[#fffdf8] hover:shadow-[0_20px_40px_-20px_rgba(197,160,89,0.4)]"
            >
              <div>
                <div className="flex items-center justify-between">
                  {/* Rating Stars */}
                  <div className="flex gap-1 text-[#c5a059]">
                    {"★★★★★".split("").map((star, i) => (
                      <span key={i} className="text-sm">{star}</span>
                    ))}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#a98032]">
                    REC // 0{index + 1}
                  </span>
                </div>
                
                <p className="mt-5 text-base leading-relaxed text-[#0a0e14]/90">
                  “{testimonial.quote}”
                </p>
              </div>

              <div className="mt-7 flex items-center gap-3.5 border-t border-[#e4dec8]/80 pt-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0a0e14] font-mono text-xs font-bold text-[#e5c97d]">
                  {testimonial.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0a0e14]">{testimonial.name}</p>
                  <p className="font-mono text-[11px] text-[#625d57]">{testimonial.project}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
