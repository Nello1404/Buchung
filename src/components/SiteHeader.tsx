import Link from "next/link";

// Kompakte, gut lesbare Wortmarke für kleine/dunkle Bereiche (Header, Footer,
// Admin). Ein gold gerahmtes „FS“-Monogramm greift das Logo-Emblem auf; das
// eigentliche Logo-Bild kommt großflächig auf Startseite, Login und TV zum Zug.
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-line-gold">
        <span className="font-serif text-sm font-bold text-gold-gradient">FS</span>
      </span>
      <span className="font-serif text-lg font-semibold tracking-wide text-ink">
        FlySpot <span className="text-gold-gradient">Valet</span>
      </span>
    </Link>
  );
}

export function SiteHeader({ transparent = false }: { transparent?: boolean }) {
  return (
    <header
      className={
        transparent
          ? "absolute inset-x-0 top-0 z-20"
          : "sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur"
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Wordmark />
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/#ablauf" className="hidden text-muted transition-colors hover:text-ink sm:block">
            So funktioniert&apos;s
          </Link>
          <Link href="/#preise" className="hidden text-muted transition-colors hover:text-ink sm:block">
            Preise
          </Link>
          <Link href="/stornieren" className="hidden text-muted transition-colors hover:text-ink sm:block">
            Stornieren
          </Link>
          <Link href="/buchen" className="btn-gold !px-5 !py-2 text-sm">
            Jetzt buchen
          </Link>
        </nav>
      </div>
    </header>
  );
}
