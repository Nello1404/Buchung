import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE = "flyspot_admin";
export const TV_COOKIE = "flyspot_tv";
const SESSION_STUNDEN = 12;
const TV_STUNDEN = 720; // TV-Bildschirm bleibt lange angemeldet

export type Rolle = "ADMIN" | "FAHRER" | "TV";

export interface Session {
  email: string;
  rolle: Rolle;
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET fehlt oder ist zu kurz (mind. 16 Zeichen).");
  }
  return new TextEncoder().encode(secret);
}

/** Zeitkonstanter String-Vergleich (schützt vor Timing-Angriffen beim Login). */
function sicherGleich(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * Prüft die Zugangsdaten des Inhaber-Kontos gegen die Umgebungsvariablen
 * ADMIN_EMAIL / ADMIN_PASSWORD. Das Passwort liegt ausschließlich als
 * Vercel-Umgebungsvariable vor (nie im Code oder in der Datenbank).
 */
export function pruefeLogin(email: string, passwort: string): Session | null {
  const eMail = email.trim().toLowerCase();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswort = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPasswort) {
    if (sicherGleich(eMail, adminEmail.trim().toLowerCase()) && sicherGleich(passwort, adminPasswort)) {
      return { email: adminEmail.trim().toLowerCase(), rolle: "ADMIN" };
    }
  }

  // Fahrer-Login (eingeschränkte Rolle) – eigenes Passwort, feste Kennung.
  const fahrerEmail = (process.env.FAHRER_EMAIL || "fahrer@flyspot-valet.de").trim().toLowerCase();
  const fahrerPasswort = process.env.FAHRER_PASSWORD;
  if (fahrerPasswort) {
    if (sicherGleich(eMail, fahrerEmail) && sicherGleich(passwort, fahrerPasswort)) {
      return { email: fahrerEmail, rolle: "FAHRER" };
    }
  }

  return null;
}

export async function erstelleToken(session: Session): Promise<string> {
  return new SignJWT({ email: session.email, rolle: session.rolle })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_STUNDEN}h`)
    .sign(secretKey());
}

export async function pruefeToken(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (typeof payload.email !== "string" || typeof payload.rolle !== "string") return null;
    return { email: payload.email, rolle: payload.rolle as Rolle };
  } catch {
    return null;
  }
}

/** Liest die aktuelle Session aus dem httpOnly-Cookie (oder null). */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return pruefeToken(token);
}

export const SESSION_MAX_AGE = SESSION_STUNDEN * 60 * 60;
export const TV_MAX_AGE = TV_STUNDEN * 60 * 60;

/** Prüft das separate TV-Passwort (COCKPIT_TV_PASSWORD). */
export function pruefeTvPasswort(passwort: string): boolean {
  const tvPasswort = process.env.COCKPIT_TV_PASSWORD;
  if (!tvPasswort) return false;
  return sicherGleich(passwort, tvPasswort);
}

export async function erstelleTvToken(): Promise<string> {
  return new SignJWT({ rolle: "TV" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TV_STUNDEN}h`)
    .sign(secretKey());
}

/** Zugang zum TV-Modus: gültige Admin-Session ODER gültiges TV-Cookie. */
export async function hatTvZugang(): Promise<boolean> {
  const admin = await getSession();
  if (admin) return true;
  const store = await cookies();
  const token = store.get(TV_COOKIE)?.value;
  if (!token) return false;
  const s = await pruefeToken(token);
  return s?.rolle === "TV";
}
