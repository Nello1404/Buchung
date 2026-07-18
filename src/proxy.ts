import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE = "flyspot_admin";

// Rollenbasierter Seitenschutz:
// - Fahrer (FAHRER) dürfen nur /admin/buchungen (Buchungen + Übergabeprotokoll).
// - Cockpit ist ausschließlich für Admin; der TV-Modus (/cockpit/tv) hat einen
//   eigenen Zugang und wird hier nicht angefasst.
async function rolleAus(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return typeof payload.rolle === "string" ? payload.rolle : null;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Eigene Zugänge / Ausnahmen
  if (pathname === "/admin/login" || pathname.startsWith("/cockpit/tv")) {
    return NextResponse.next();
  }

  const rolle = await rolleAus(req);

  const login = new URL("/admin/login", req.url);
  const buchungen = new URL("/admin/buchungen", req.url);

  if (!rolle) {
    // Nicht angemeldet → zur Anmeldung.
    return NextResponse.redirect(login);
  }

  if (rolle === "FAHRER") {
    // Fahrer nur in den Buchungen.
    if (pathname.startsWith("/admin/buchungen")) return NextResponse.next();
    return NextResponse.redirect(buchungen);
  }

  if (rolle === "ADMIN") return NextResponse.next();

  // Unbekannte Rolle → sicherheitshalber zur Anmeldung.
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/cockpit/:path*"],
};
