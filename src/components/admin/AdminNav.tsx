"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type NavLink = { href: string; label: string; extern?: boolean; exact?: boolean };
type NavGruppe = { titel: string; links: NavLink[] };

// Gruppierte Navigation – zusammengehörige Bereiche stehen beieinander.
const gruppen: NavGruppe[] = [
  {
    titel: "Betrieb",
    links: [
      { href: "/admin", label: "Übersicht", exact: true },
      { href: "/admin/buchungen", label: "Buchungen" },
      { href: "/admin/manuell", label: "Manuell buchen" },
    ],
  },
  {
    titel: "Auswertung",
    links: [
      { href: "/cockpit/umsatz", label: "Umsatz" },
      { href: "/cockpit/finanzen", label: "Finanzen" },
      { href: "/cockpit/plan", label: "Plan-Ist" },
      { href: "/cockpit/tv", label: "TV-Modus", extern: true },
    ],
  },
  {
    titel: "Team",
    links: [
      { href: "/admin/mitarbeiter", label: "Mitarbeiter" },
      { href: "/admin/einsatzplan", label: "Einsatzplanung" },
    ],
  },
  {
    titel: "Service",
    links: [
      { href: "/admin/service", label: "Service-Katalog", exact: true },
      { href: "/admin/service-anfragen", label: "Service-Anfragen" },
    ],
  },
  {
    titel: "Preise & Kapazität",
    links: [
      { href: "/admin/tarife", label: "Preise & Tarife" },
      { href: "/admin/saison", label: "Saison & Sperrtage" },
      { href: "/admin/kapazitaet", label: "Kapazität" },
      { href: "/admin/gutscheine", label: "Gutscheine" },
    ],
  },
  {
    titel: "Website",
    links: [
      { href: "/admin/bilder", label: "Bilder" },
      { href: "/admin/inhalte", label: "Rechtstexte" },
    ],
  },
];

// Fahrer sehen nur die Buchungen (dort auch das Übergabeprotokoll).
const fahrerLinks: NavLink[] = [{ href: "/admin/buchungen", label: "Buchungen" }];

export function AdminNav({ email, rolle }: { email: string; rolle?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const istFahrer = rolle === "FAHRER";

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function linkClass(l: NavLink): string {
    const aktiv = l.exact ? pathname === l.href : pathname.startsWith(l.href);
    return `rounded-lg px-3 py-2 text-sm transition-colors ${
      aktiv ? "bg-[rgba(200,164,92,0.1)] text-gold" : "text-muted hover:text-ink"
    }`;
  }

  return (
    <aside className="border-b border-line bg-surface md:w-64 md:border-b-0 md:border-r">
      <div className="flex flex-col gap-1 p-4 md:h-full">
        <div className="mb-4 px-2 pt-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line-gold">
              <span className="font-serif text-xs font-bold text-gold-gradient">FS</span>
            </span>
            <span className="font-serif text-lg font-semibold text-ink">
              FlySpot <span className="text-gold-gradient">Valet</span>
            </span>
          </div>
          <p className="mt-1.5 text-xs text-subtle">{istFahrer ? "Fahrer-Bereich" : "Admin-Bereich"}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-4">
          {istFahrer ? (
            <div className="flex flex-col gap-1">
              {fahrerLinks.map((l) => (
                <Link key={l.href} href={l.href} className={linkClass(l)}>{l.label}</Link>
              ))}
            </div>
          ) : (
            gruppen.map((g) => (
              <div key={g.titel} className="flex flex-col gap-0.5">
                <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-subtle">{g.titel}</p>
                {g.links.map((l) =>
                  l.extern ? (
                    <a key={l.href} href={l.href} target="_blank" rel="noopener" className={linkClass(l)}>
                      {l.label} <span className="text-xs text-subtle">↗</span>
                    </a>
                  ) : (
                    <Link key={l.href} href={l.href} className={linkClass(l)}>{l.label}</Link>
                  )
                )}
              </div>
            ))
          )}
        </nav>

        <div className="mt-4 border-t border-line px-2 pt-4">
          <p className="truncate text-xs text-subtle" title={email}>{email}</p>
          <button onClick={logout} className="mt-2 text-sm text-muted transition-colors hover:text-ink">
            Abmelden
          </button>
        </div>
      </div>
    </aside>
  );
}
