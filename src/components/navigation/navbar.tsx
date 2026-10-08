"use client";

import Link from "next/link";
import { useState } from "react";
import { Container } from "@/components/layout/container";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Process", href: "/process" },
  { label: "Estimate", href: "/estimate" },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e4dec8]/90 bg-[#f8f6f0]/90 backdrop-blur-xl transition-all duration-300">
      <Container className="flex items-center justify-between gap-4 py-3 sm:gap-6 sm:py-3.5">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-2.5 text-base font-semibold tracking-[0.22em] text-[#0a0e14] uppercase transition-transform active:scale-95">
          <span className="gold-gradient-bg flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-[#0a0e14] shadow-md shadow-[#c5a059]/25 transition-transform duration-300 group-hover:scale-105">
            B
          </span>
          <span className="font-extrabold tracking-[0.24em] text-[#0a0e14] transition-colors group-hover:text-[#c5a059]">
            BUILDORA
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group relative py-1 text-sm font-semibold tracking-wide text-[#625d57] transition-colors duration-200 hover:text-[#0a0e14]"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 h-0.5 w-0 gold-gradient-bg transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden items-center gap-3.5 lg:flex">
          <Link
            href="/auth/login"
            className="group/login inline-flex items-center gap-2 rounded-full border border-[#c5a059]/40 bg-white/60 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#625d57] shadow-2xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c5a059] hover:bg-[#fffdf8] hover:text-[#0a0e14] hover:shadow-[0_4px_12px_rgba(197,160,89,0.2)] active:scale-95"
          >
            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#0a0e14] text-[9px] font-black text-white transition-colors group-hover/login:bg-[#c5a059] group-hover/login:text-[#0a0e14]">
              ↗
            </span>
            Client Login
          </Link>
          <Link
            href="/request-project"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#0a0e14] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-black/10 transition-all duration-300 hover:bg-[#c5a059] hover:text-[#0a0e14] hover:shadow-[#c5a059]/30 hover:scale-[1.02] active:scale-95"
          >
            <span>Request Project</span>
            <span className="text-xs transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="inline-flex items-center justify-center rounded-xl border border-[#e4dec8] bg-white p-2.5 text-[#0e1319] shadow-sm transition-transform active:scale-95 lg:hidden"
        >
          <span className="sr-only">Open menu</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
            {isMenuOpen ? (
              <path d="M6.225 4.811a1 1 0 00-1.414 1.414L10.586 12l-5.775 5.775a1 1 0 101.414 1.414L12 13.414l5.775 5.775a1 1 0 001.414-1.414L13.414 12l5.775-5.775a1 1 0 00-1.414-1.414L12 10.586 6.225 4.811z" />
            ) : (
              <path d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75Zm0 5.5A.75.75 0 0 1 3.75 12h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12.25Zm0 5.5A.75.75 0 0 1 3.75 17.5h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 17.75Z" />
            )}
          </svg>
        </button>
      </Container>

      {/* Mobile Navigation Drawer */}
      {isMenuOpen && (
        <div id="mobile-navigation" className="border-t border-[#e4dec8] bg-white px-4 py-6 shadow-xl lg:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <Container as="nav" aria-label="Mobile navigation" className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-base font-semibold text-[#0e1319] transition-colors hover:text-[#c5a059]"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3 border-t border-[#e4dec8] pt-4">
              <Link
                href="/auth/login"
                className="text-center text-sm font-semibold uppercase tracking-[0.14em] text-[#625d57] py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Client Login
              </Link>
              <Link
                href="/request-project"
                className="gold-gradient-bg flex items-center justify-center gap-2 rounded-full py-3 text-xs font-extrabold uppercase tracking-[0.16em] text-[#0e1319] shadow-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Request a Project
              </Link>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
