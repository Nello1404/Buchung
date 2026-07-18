"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

// Logo-Darstellung im Header:
//  - "bild":      die echte Logodatei (public/logo.png) via next/image
//  - "wortmarke": kompakte Text-Wortmarke mit FS-Monogramm (beste Lesbarkeit
//                 auf dunklem Grund)
// Umschaltbar an EINER Stelle:
const LOGO_VARIANTE: "bild" | "wortmarke" = "wortmarke";

const navLinks = [
  { href: "/#ablauf", hash: "ablauf", label: "So funktioniert's" },
  { href: "/#preise", hash: "preise", label: "Preise" },
  { href: "/#einblicke", hash: "einblicke", label: "Einblicke" },
  { href: "/stornieren", hash: "", label: "Stornieren" },
];

/** Text-Wortmarke (auch im Footer verwendet). */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line-gold">
        <span className="font-serif text-sm font-bold text-gold-gradient">FS</span>
      </span>
      <span className="font-serif text-lg font-semibold tracking-wide text-ink">
        FlySpot <span className="text-gold-gradient">Valet</span>
      </span>
    </span>
  );
}

function HeaderLogo() {
  if (LOGO_VARIANTE === "wortmarke") {
    return (
      <Link href="/" aria-label="FlySpot Valet – zur Startseite" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-gold">
        <Wordmark />
      </Link>
    );
  }
  return (
    <Link
      href="/"
      aria-label="FlySpot Valet – zur Startseite"
      className="inline-flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <Image
        src="/logo.png"
        alt="FlySpot Valet"
        width={56}
        height={56}
        priority
        className="h-10 w-10 sm:h-12 sm:w-12"
      />
      <span className="font-serif text-lg font-semibold tracking-wide text-ink sm:text-xl">
        FlySpot <span className="text-gold-gradient">Valet</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [offen, setOffen] = useState(false);
  const [aktiv, setAktiv] = useState<string>("");

  // Solide/Blur, sobald man ein Stück gescrollt hat (nur im Overlay-Modus relevant).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-Spy: aktiven Menüpunkt hervorheben.
  useEffect(() => {
    const ids = navLinks.map((l) => l.hash).filter(Boolean);
    const elemente = ids
      .map((id) => document.getElementById(id))
      .filter((e): e is HTMLElement => e !== null);
    if (elemente.length === 0) return;

    const obs = new IntersectionObserver(
      (eintraege) => {
        const sichtbar = eintraege
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (sichtbar) setAktiv(sichtbar.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5] }
    );
    elemente.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, []);

  // Menü schließen bei Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOffen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fest = !transparent || scrolled;
  const positionKlasse = transparent ? "fixed" : "sticky";

  return (
    <header
      className={`${positionKlasse} inset-x-0 top-0 z-40 transition-colors duration-300 motion-reduce:transition-none ${
        fest ? "border-b border-line bg-bg/80 backdrop-blur-md" : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
        <HeaderLogo />

        {/* Desktop-Navigation */}
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((l) => {
            const istAktiv = l.hash && aktiv === l.hash;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative py-1 text-sm outline-none transition-colors focus-visible:text-ink ${
                  istAktiv ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {l.label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-px bg-gold transition-all duration-300 motion-reduce:transition-none ${
                    istAktiv ? "w-full" : "w-0"
                  }`}
                />
              </Link>
            );
          })}
          <Link
            href="/buchen"
            className="btn-gold !px-5 !py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
          >
            Jetzt buchen
          </Link>
        </nav>

        {/* Mobil: CTA kompakt + Burger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/buchen" className="btn-gold !px-4 !py-2 text-sm">
            Buchen
          </Link>
          <button
            type="button"
            onClick={() => setOffen((o) => !o)}
            aria-label={offen ? "Menü schließen" : "Menü öffnen"}
            aria-expanded={offen}
            aria-controls="mobile-menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {offen ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobiles Menü */}
      <div
        id="mobile-menu"
        className={`overflow-hidden border-t border-line bg-bg/95 backdrop-blur-md transition-[max-height] duration-300 motion-reduce:transition-none md:hidden ${
          offen ? "max-h-80" : "max-h-0"
        }`}
      >
        <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-3">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOffen(false)}
              className={`rounded-lg px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                l.hash && aktiv === l.hash ? "bg-[rgba(200,164,92,0.1)] text-gold" : "text-muted hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
