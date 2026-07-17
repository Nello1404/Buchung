import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export function Wordmark({ className = "" }: { className?: string }) {
  return <BrandLogo className={className} imgClassName="h-10 w-auto" />;
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
