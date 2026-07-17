import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE = "flyspot_admin";
const SESSION_STUNDEN = 12;

export type Rolle = "ADMIN" | "FAHRER";

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
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswort = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPasswort) return null;

  const emailOk = sicherGleich(email.trim().toLowerCase(), adminEmail.trim().toLowerCase());
  const passOk = sicherGleich(passwort, adminPasswort);
  if (emailOk && passOk) {
    return { email: adminEmail.trim().toLowerCase(), rolle: "ADMIN" };
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
