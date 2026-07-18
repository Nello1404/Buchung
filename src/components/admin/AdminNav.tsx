"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/cockpit", label: "Betriebszentrale" },
  { href: "/admin/buchungen", label: "Buchungen" },
  { href: "/admin/manuell", label: "Manuell buchen" },
  { href: "/admin/tarife", label: "Preise & Tarife" },
  { href: "/admin/saison", label: "Saison & Sperrtage" },
  { href: "/admin/kapazitaet", label: "Kapazität" },
  { href: "/admin/gutscheine", label: "Gutscheine" },
  { href: "/admin/bilder", label: "Bilder" },
  { href: "/admin/inhalte", label: "Rechtstexte" },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
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
          <p className="mt-1.5 text-xs text-subtle">Admin-Bereich</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {links.map((l) => {
            const aktiv = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-2 text-sm transition-colors ${
                  aktiv ? "bg-[rgba(200,164,92,0.1)] text-gold" : "text-muted hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-line px-2 pt-4">
          <p className="truncate text-xs text-subtle" title={email}>{email}</p>
          <button
            onClick={logout}
            className="mt-2 text-sm text-muted transition-colors hover:text-ink"
          >
            Abmelden
          </button>
        </div>
      </div>
    </aside>
  );
}
