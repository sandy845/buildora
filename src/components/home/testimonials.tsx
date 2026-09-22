import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { getTestimonials } from "@/lib/data-access";

export function Testimonials() {
  const testimonials = getTestimonials();
  return (
    <Section>
      <Container>
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">Client feedback</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-primary sm:text-4xl">
            Trusted by homeowners and businesses who want clarity and craft.
          </h2>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.name} className="rounded-3xl border border-border bg-white p-6">
              <p className="text-base leading-7 text-primary">“{testimonial.quote}”</p>
              <div className="mt-6 border-t border-border pt-4">
                <p className="font-semibold text-primary">{testimonial.name}</p>
                <p className="mt-1 text-sm text-muted">{testimonial.project}</p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
