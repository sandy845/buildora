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
    <footer className="border-t border-border bg-white">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Buildora
            </p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
              Premium construction and interior design services for residential and commercial spaces.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              Services
            </p>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              {serviceLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition-colors hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              Company
            </p>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition-colors hover:text-primary">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
              Contact
            </p>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li>
                {contactDetails.phones.map((phone, index) => (
                  <span key={phone}>
                    {index > 0 && <span className="mx-2">|</span>}
                    <a href={`tel:+91${phone}`} className="hover:text-primary">
                      {phone}
                    </a>
                  </span>
                ))}
              </li>
              <li>
                <a href={`mailto:${contactDetails.email}`} className="hover:text-primary">
                  {contactDetails.email}
                </a>
              </li>
              <li>{contactDetails.address}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-6 border-t border-border pt-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted">© 2026 Buildora. All rights reserved.</p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-sm text-muted">
            {socialLinks.map((item) => (
              <a key={item.label} href={item.href} className="transition-colors hover:text-primary">
                {item.label}
              </a>
            ))}
          </div>
        </div>

      </Container>
    </footer>
  );
}
