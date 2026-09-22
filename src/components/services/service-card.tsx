import Link from "next/link";
import type { PublicService } from "@/lib/public-data";

type ServiceCardProps = {
  service: PublicService;
  index: number;
};

export function ServiceCard({ service, index }: ServiceCardProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border bg-white p-6 shadow-sm transition-all duration-500 ease-out hover:-translate-y-2 hover:border-[#c5a059]/60 hover:bg-[#fffdf8] hover:shadow-[0_24px_46px_-22px_rgba(197,160,89,0.6)] sm:p-7">
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#c5a059]/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold text-primary transition-colors duration-300 group-hover:border-[#c5a059]/60 group-hover:bg-[#fbf3df]">
          {service.title.slice(0, 1)}
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b88e38]">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <h2 className="relative mt-5 text-2xl font-semibold tracking-[-0.04em] text-primary">
        {service.title}
      </h2>

      <p className="mt-3 text-sm leading-6 text-muted">{service.shortDescription}</p>

      <ul className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm text-muted">
        {service.highlights.slice(0, 3).map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c5a059]" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <Link
        href={`/services/${service.slug}`}
        className="mt-auto inline-flex items-center gap-2 border-t border-border pt-5 text-sm font-semibold text-primary transition-colors hover:text-[#9d7522]"
      >
        View service details
        <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
