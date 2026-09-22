import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { getTrustStats } from "@/lib/data-access";

export function Trust() {
  const trustStats = getTrustStats();
  return (
    <Section>
      <Container>
        <div className="flex flex-col gap-8 border-y border-border py-6 md:flex-row md:items-center md:justify-between">
          {trustStats.map((item) => (
            <div key={item.label}>
              <p className="text-3xl font-semibold tracking-[-0.06em] text-primary">{item.value}</p>
              <p className="mt-2 max-w-[18rem] text-sm text-muted">{item.label}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
