import Link from "next/link";
import type { PublicService } from "@/lib/public-data";

type ServiceCardProps = {
  service: PublicService;
  index: number;
};

export function ServiceCard({ service, index }: ServiceCardProps) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#e4dec8] bg-white p-7 shadow-sm transition-all duration-400 ease-out hover:-translate-y-2 hover:border-[#c5a059] hover:bg-[#fffdf8] hover:shadow-[0_24px_48px_-20px_rgba(197,160,89,0.5)]">
      {/* Subtle architectural ambient light */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#c5a059]/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
      
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-black tracking-widest text-[#a98032]">
          DISCIPLINE 0{index + 1} //
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f8f6f0] font-mono text-xs font-bold text-[#0a0e14] ring-1 ring-[#e4dec8]">
          {service.title.slice(0, 1)}
        </span>
      </div>

      <h2 className="relative mt-5 text-2xl font-bold tracking-tight text-[#0a0e14] transition-colors duration-300 group-hover:text-[#a98032]">
        {service.title}
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-[#625d57]">{service.shortDescription}</p>

      <ul className="mt-6 space-y-2.5 border-t border-[#e4dec8]/80 pt-5 text-sm text-[#625d57]">
        {service.highlights.slice(0, 3).map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c5a059]" aria-hidden="true" />
            <span className="text-xs font-medium">{item}</span>
          </li>
        ))}
      </ul>

      <Link
        href={`/services/${service.slug}`}
        className="mt-auto inline-flex items-center gap-2 border-t border-[#e4dec8]/80 pt-5 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#0a0e14] transition-colors hover:text-[#a98032]"
      >
        <span>Specifications &amp; Scope</span>
        <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
