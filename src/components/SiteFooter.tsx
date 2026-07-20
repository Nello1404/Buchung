import Link from "next/link";
import { Wordmark } from "@/components/SiteHeader";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Premium Valet- und Shuttle-Parken direkt am Flughafen Frankfurt. Ihr Fahrzeug in
              besten Händen – versichert, bewacht und pünktlich bereitgestellt.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3">
            <div>
              <h3 className="mb-3 font-medium text-ink">Service</h3>
              <ul className="space-y-2 text-muted">
                <li><Link href="/buchen" className="transition-colors hover:text-gold">Parkplatz buchen</Link></li>
                <li><Link href="/service" className="transition-colors hover:text-gold">FlySpot Service</Link></li>
                <li><Link href="/stornieren" className="transition-colors hover:text-gold">Buchung stornieren</Link></li>
                <li><Link href="/#ablauf" className="transition-colors hover:text-gold">So funktioniert&apos;s</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-medium text-ink">Rechtliches</h3>
              <ul className="space-y-2 text-muted">
                <li><Link href="/impressum" className="transition-colors hover:text-gold">Impressum</Link></li>
                <li><Link href="/datenschutz" className="transition-colors hover:text-gold">Datenschutz</Link></li>
                <li><Link href="/agb" className="transition-colors hover:text-gold">AGB</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-medium text-ink">Kontakt</h3>
              <ul className="space-y-2 text-muted">
                <li>Flughafen Frankfurt</li>
                <li>www.flyspot-valet.de</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6 text-xs text-subtle">
          © {new Date().getFullYear()} FlySpot Valet · Alle Preise inkl. 19 % USt.
        </div>
      </div>
    </footer>
  );
}
