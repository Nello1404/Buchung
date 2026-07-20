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
 * Sammelt alle konfigurierten Admin-Zugänge aus den Umgebungsvariablen:
 * ADMIN_EMAIL / ADMIN_PASSWORD (Admin 1, rückwärtskompatibel) sowie optional
 * ADMIN2_EMAIL / ADMIN2_PASSWORD, ADMIN3_EMAIL / ADMIN3_PASSWORD usw. Passwörter
 * liegen ausschließlich als Vercel-Umgebungsvariablen vor (nie im Code/DB).
 * Beliebig viele Admins können sich parallel auf eigenen Geräten anmelden.
 */
function ladeAdminZugaenge(): { email: string; passwort: string }[] {
  const zugaenge: { email: string; passwort: string }[] = [];

  const ersteEmail = process.env.ADMIN_EMAIL;
  const erstesPasswort = process.env.ADMIN_PASSWORD;
  if (ersteEmail && erstesPasswort) {
    zugaenge.push({ email: ersteEmail.trim().toLowerCase(), passwort: erstesPasswort });
  }

  for (let i = 2; i <= 10; i++) {
    const email = process.env[`ADMIN${i}_EMAIL`];
    const passwort = process.env[`ADMIN${i}_PASSWORD`];
    if (email && passwort) {
      zugaenge.push({ email: email.trim().toLowerCase(), passwort });
    }
  }

  return zugaenge;
}

/**
 * Prüft die Zugangsdaten gegen die konfigurierten Admin-Konten und (separat)
 * das Fahrer-Konto. Der zeitkonstante Vergleich schützt vor Timing-Angriffen.
 */
export function pruefeLogin(email: string, passwort: string): Session | null {
  const eMail = email.trim().toLowerCase();

  for (const admin of ladeAdminZugaenge()) {
    if (sicherGleich(eMail, admin.email) && sicherGleich(passwort, admin.passwort)) {
      return { email: admin.email, rolle: "ADMIN" };
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
