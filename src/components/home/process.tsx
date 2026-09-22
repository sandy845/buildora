import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { getHomeProcess } from "@/lib/data-access";

export function Process() {
  const process = getHomeProcess();

  return (
    <Section id="process" className="relative isolate overflow-hidden bg-[#f3efe5] py-20 lg:py-28">
      <div className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-[#c5a059]/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-[#d9e2e3]/80 blur-3xl" />

      <Container>
        <div className="relative grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-[#c5a059]/40 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#a98032] shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#c5a059] shadow-[0_0_14px_#c5a059]" />
              How we work
            </div>
            <h2 className="mt-6 text-4xl font-extrabold leading-[1.04] tracking-[-0.06em] text-primary sm:text-5xl">
              A clear path from idea to a <span className="gold-gradient-text">completed space.</span>
            </h2>
          </div>
          <div className="rounded-3xl border border-primary/10 bg-white/55 p-6 shadow-sm backdrop-blur">
            <p className="text-sm leading-6 text-muted">
              Every project moves through a deliberate sequence, giving you visibility, confident decisions, and a finished space that feels exactly right.
            </p>
          </div>
        </div>

        <div className="relative mt-14">
          <div className="absolute left-[1.35rem] top-8 hidden h-[calc(100%-4rem)] w-px bg-linear-to-b from-[#c5a059] via-[#c5a059]/50 to-transparent md:block" />
          <div className="space-y-4">
            {process.map((item, index) => (
              <article
                key={item.step}
                className="group relative grid gap-5 rounded-[1.75rem] border border-primary/10 bg-white/75 p-5 shadow-sm backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:border-[#c5a059]/60 hover:bg-white hover:shadow-xl hover:shadow-[#c5a059]/10 md:grid-cols-[80px_1fr_1.5fr] md:items-center md:p-6"
              >
                <div className="relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-sm font-black text-white shadow-lg shadow-primary/20 transition-all duration-500 group-hover:bg-[#c5a059] group-hover:text-primary group-hover:shadow-[#c5a059]/30">
                  {item.step}
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#a98032]">
                    Phase {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="text-xl font-bold tracking-[-0.04em] text-primary transition-colors group-hover:text-[#a98032]">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm leading-6 text-muted">{item.description}</p>
                <div className="absolute bottom-0 left-24 h-1 w-0 rounded-full bg-[#c5a059] transition-all duration-500 group-hover:w-24" />
              </article>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
