import Link from "next/link";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full gold-gradient">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#1a140a" strokeWidth="2">
          <path d="M3 13l1.5-4.5A2 2 0 016.4 7h11.2a2 2 0 011.9 1.5L21 13" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 13h14v4a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H8v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-4z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
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
