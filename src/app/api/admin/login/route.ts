import { NextResponse } from "next/server";
import { z } from "zod";
import { AUTH_COOKIE, erstelleToken, pruefeLogin, SESSION_MAX_AGE } from "@/lib/auth";

const schema = z.object({ email: z.string().trim().min(1), passwort: z.string().min(1) });

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  let session;
  try {
    session = pruefeLogin(parsed.data.email, parsed.data.passwort);
  } catch {
    return NextResponse.json({ error: "Login ist nicht konfiguriert (AUTH_SECRET fehlt)." }, { status: 500 });
  }
  if (!session) {
    return NextResponse.json({ error: "E-Mail oder Passwort ist falsch." }, { status: 401 });
  }

  const token = await erstelleToken(session);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
