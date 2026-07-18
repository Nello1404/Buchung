"use client";

// Bewusst natives <img>: das Logo kann eine beliebige, vom Kunden hochgeladene
// PNG sein – ohne feste Maße für next/image – und braucht den onError-Fallback.
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";

// Bevorzugt das hochgeladene Logo (public/logo.png). Fehlt es, wird automatisch
// der mitgelieferte SVG-Platzhalter (public/logo.svg) angezeigt – sobald die
// echte PNG-Datei in public/ liegt, erscheint sie überall ohne Code-Änderung.
// Optional lässt sich der Dateiname über NEXT_PUBLIC_LOGO_FILE überschreiben.
const PRIMARY = process.env.NEXT_PUBLIC_LOGO_FILE || "/logo.png";
const FALLBACK = "/logo.svg";

export function BrandLogo({
  href = "/" as string | null,
  className = "",
  imgClassName = "h-9 w-auto",
}: {
  href?: string | null;
  className?: string;
  imgClassName?: string;
}) {
  const [src, setSrc] = useState(PRIMARY);

  const img = (
    <img
      src={src}
      alt="FlySpot Valet"
      className={imgClassName}
      onError={() => {
        if (src !== FALLBACK) setSrc(FALLBACK);
      }}
    />
  );

  if (href === null) {
    return <span className={`inline-flex items-center ${className}`}>{img}</span>;
  }
  return (
    <Link href={href} className={`inline-flex items-center ${className}`}>
      {img}
    </Link>
  );
}
