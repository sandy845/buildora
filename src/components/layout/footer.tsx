import Link from "next/link";
import { Container } from "@/components/layout/container";

const serviceLinks = [
  { label: "Residential Construction", href: "/services" },
  { label: "Interior Design", href: "/services" },
  { label: "Renovation", href: "/services" },
  { label: "Project Planning", href: "/services" },
];

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Projects", href: "/projects" },
  { label: "Process", href: "/process" },
  { label: "Estimate", href: "/estimate" },
];

const contactDetails = {
  phones: ["9892802029", "9004331746"],
  email: "sandipkami355@gmail.com",
  address: "All over India",
};

const socialLinks = [
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "Facebook", href: "#" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-[#e4dec8]/80 bg-[#0a0e14] text-white">
      {/* Subtle blueprint grid overlay */}
      <div className="tech-blueprint-grid-dark pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

      <Container className="relative z-10 py-16 sm:py-20">
        {/* Technical Status Strip */}
        <div className="mb-14 flex flex-col justify-between gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">
              System Status // All Active Sites On Schedule
            </span>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-wider text-white/45">
            BIM.CAD / SPEC.V2.4 · 2026 EDITION
          </div>
        </div>

        <div className="grid gap-12 md:grid-cols-[1.3fr_0.8fr_0.8fr_1.1fr]">
          {/* Brand Col */}
          <div>
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <span className="gold-gradient-bg flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-[#0a0e14] shadow-md shadow-[#c5a059]/30">
                B
              </span>
              <span className="text-base font-bold tracking-[0.25em] text-white transition-colors group-hover:text-[#e5c97d]">
                BUILDORA
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
              High-precision architectural engineering, bespoke residential builds, and turnkey commercial interiors delivered with transparency across India.
            </p>
            <div className="mt-6 flex items-center gap-2 font-mono text-[11px] text-[#e5c97d]">
              <span>◆</span>
              <span>RERA Compliant &amp; Structural Audit Ready</span>
            </div>
          </div>

          {/* Services Links */}
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#e5c97d]">
              Services
            </p>
            <ul className="mt-5 space-y-3 text-sm text-white/65">
              {serviceLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition-colors duration-200 hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#e5c97d]">
              Company
            </p>
            <ul className="mt-5 space-y-3 text-sm text-white/65">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition-colors duration-200 hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#e5c97d]">
              Direct Line
            </p>
            <ul className="mt-5 space-y-3.5 text-sm text-white/65">
              <li className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#e5c97d]">TEL:</span>
                {contactDetails.phones.map((phone, index) => (
                  <span key={phone}>
                    {index > 0 && <span className="mx-1.5 text-white/30">/</span>}
                    <a href={`tel:+91${phone}`} className="transition-colors hover:text-white">
                      +91 {phone}
                    </a>
                  </span>
                ))}
              </li>
              <li className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#e5c97d]">MAIL:</span>
                <a href={`mailto:${contactDetails.email}`} className="transition-colors hover:text-white">
                  {contactDetails.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#e5c97d]">LOC:</span>
                <span>{contactDetails.address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 flex flex-col gap-6 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-xs text-white/50">
            © 2026 Buildora Infrastructure &amp; Living. All architectural rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-6 font-mono text-xs text-white/50">
            {socialLinks.map((item) => (
              <a key={item.label} href={item.href} className="transition-colors hover:text-[#e5c97d]">
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
