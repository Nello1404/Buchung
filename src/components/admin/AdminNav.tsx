"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type NavLink = { href: string; label: string; icon: keyof typeof ICONS; extern?: boolean; exact?: boolean };
type NavGruppe = { titel: string; links: NavLink[] };

// Kompakte, einheitliche Strich-Icons (20×20) für die Navigation.
const ICONS = {
  home: "M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10",
  liste: "M4 6h16M4 12h16M4 18h10",
  plus: "M12 5v14M5 12h14",
  chart: "M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8",
  euro: "M16 6a6 6 0 100 12M4 10h8M4 14h7",
  ziel: "M12 3v4M12 17v4M3 12h4M17 12h4M12 12h.01",
  monitor: "M3 5h18v11H3zM9 20h6M12 16v4",
  team: "M8 11a3 3 0 100-6 3 3 0 000 6zM2 20a6 6 0 0112 0M17 11a3 3 0 10-1-5.83M16 20a6 6 0 015-9.32",
  kalender: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M12 14v3M12 14l2 2",
  funken: "M12 3l1.8 4.9L18 9.7l-4.2 1.8L12 16l-1.8-4.5L6 9.7l4.2-1.8z",
  inbox: "M4 13h4l1 3h6l1-3h4M4 13l2-7h12l2 7v6H4z",
  tag: "M4 4h7l9 9-7 7-9-9zM8 8h.01",
  kalenderx: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M10 14l4 4M14 14l-4 4",
  tacho: "M4 18a8 8 0 1116 0M12 18l4-5",
  ticket: "M4 7h16v3a2 2 0 000 4v3H4v-3a2 2 0 000-4zM12 7v10",
  bild: "M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5",
  dokument: "M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6",
} as const;

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  );
}

const gruppen: NavGruppe[] = [
  {
    titel: "Betrieb",
    links: [
      { href: "/admin", label: "Übersicht", icon: "home", exact: true },
      { href: "/admin/buchungen", label: "Buchungen", icon: "liste" },
      { href: "/admin/manuell", label: "Manuell buchen", icon: "plus" },
    ],
  },
  {
    titel: "Auswertung",
    links: [
      { href: "/cockpit/umsatz", label: "Umsatz", icon: "chart" },
      { href: "/cockpit/finanzen", label: "Finanzen", icon: "euro" },
      { href: "/cockpit/plan", label: "Plan-Ist", icon: "ziel" },
      { href: "/cockpit/tv", label: "TV-Modus", icon: "monitor", extern: true },
    ],
  },
  {
    titel: "Team",
    links: [
      { href: "/admin/mitarbeiter", label: "Mitarbeiter", icon: "team" },
      { href: "/admin/einsatzplan", label: "Einsatzplanung", icon: "kalender" },
    ],
  },
  {
    titel: "Service",
    links: [
      { href: "/admin/service", label: "Service-Katalog", icon: "funken", exact: true },
      { href: "/admin/service-anfragen", label: "Service-Anfragen", icon: "inbox" },
    ],
  },
  {
    titel: "Preise & Kapazität",
    links: [
      { href: "/admin/tarife", label: "Preise & Tarife", icon: "tag" },
      { href: "/admin/saison", label: "Saison & Sperrtage", icon: "kalenderx" },
      { href: "/admin/kapazitaet", label: "Kapazität", icon: "tacho" },
      { href: "/admin/gutscheine", label: "Gutscheine", icon: "ticket" },
    ],
  },
  {
    titel: "Website",
    links: [
      { href: "/admin/bilder", label: "Bilder", icon: "bild" },
      { href: "/admin/inhalte", label: "Rechtstexte", icon: "dokument" },
    ],
  },
];

const fahrerLinks: NavLink[] = [{ href: "/admin/buchungen", label: "Buchungen", icon: "liste" }];

export function AdminNav({ email, rolle }: { email: string; rolle?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const istFahrer = rolle === "FAHRER";
  const [offen, setOffen] = useState(false);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function istAktiv(l: NavLink): boolean {
    return l.exact ? pathname === l.href : pathname.startsWith(l.href);
  }

  function LinkZeile({ l }: { l: NavLink }) {
    const aktiv = istAktiv(l);
    const cls = `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
      aktiv ? "bg-[rgba(200,164,92,0.12)] text-gold" : "text-muted hover:bg-[rgba(255,255,255,0.03)] hover:text-ink"
    }`;
    const inhalt = (
      <>
        <Icon name={l.icon} />
        <span>{l.label}</span>
        {l.extern && <span className="ml-auto text-xs text-subtle">↗</span>}
      </>
    );
    return l.extern ? (
      <a href={l.href} target="_blank" rel="noopener" className={cls} onClick={() => setOffen(false)}>{inhalt}</a>
    ) : (
      <Link href={l.href} className={cls} onClick={() => setOffen(false)}>{inhalt}</Link>
    );
  }

  return (
    <aside className="border-b border-line bg-surface md:w-64 md:border-b-0 md:border-r">
      <div className="flex flex-col md:h-full">
        {/* Kopf – auf Mobil mit Burger */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line-gold">
              <span className="font-serif text-xs font-bold text-gold-gradient">FS</span>
            </span>
            <div>
              <span className="font-serif text-lg font-semibold text-ink">
                FlySpot <span className="text-gold-gradient">Valet</span>
              </span>
              <p className="text-xs text-subtle">{istFahrer ? "Fahrer-Bereich" : "Admin-Bereich"}</p>
            </div>
          </div>
          <button
            onClick={() => setOffen((v) => !v)}
            className="rounded-lg border border-line p-2 text-muted md:hidden"
            aria-label="Menü"
            aria-expanded={offen}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {offen ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {/* Navigation – auf Mobil ein-/ausklappbar, ab md immer sichtbar */}
        <nav className={`flex-1 flex-col gap-4 px-4 pb-4 ${offen ? "flex" : "hidden"} md:flex`}>
          {istFahrer ? (
            <div className="flex flex-col gap-1">
              {fahrerLinks.map((l) => <LinkZeile key={l.href} l={l} />)}
            </div>
          ) : (
            gruppen.map((g) => (
              <div key={g.titel} className="flex flex-col gap-0.5">
                <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-subtle">{g.titel}</p>
                {g.links.map((l) => <LinkZeile key={l.href} l={l} />)}
              </div>
            ))
          )}
        </nav>

        {/* Abmelden */}
        <div className={`border-t border-line p-4 ${offen ? "block" : "hidden"} md:block`}>
          <p className="truncate text-xs text-subtle" title={email}>{email}</p>
          <button onClick={logout} className="mt-2 text-sm text-muted transition-colors hover:text-ink">Abmelden</button>
        </div>
      </div>
    </aside>
  );
}
