import { NextResponse } from "next/server";
import { getSession, type Session } from "@/lib/auth";

/** Nur Inhaber/Admin. */
export async function requireAdmin(): Promise<{ session: Session } | { response: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return { response: NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 }) };
  }
  if (session.rolle !== "ADMIN") {
    return { response: NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 }) };
  }
  return { session };
}

/** Admin ODER Fahrer – für den operativen Alltag (Buchungen, Protokoll, Flugstatus). */
export async function requireStaff(): Promise<{ session: Session } | { response: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return { response: NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 }) };
  }
  if (session.rolle !== "ADMIN" && session.rolle !== "FAHRER") {
    return { response: NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 }) };
  }
  return { session };
}
