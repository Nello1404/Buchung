import { NextResponse } from "next/server";
import { getSession, type Session } from "@/lib/auth";

/** Für Admin-API-Routen: liefert die Session oder eine 401-Antwort. */
export async function requireAdmin(): Promise<{ session: Session } | { response: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return { response: NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 }) };
  }
  return { session };
}
