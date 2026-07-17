import { NextResponse } from "next/server";
import { z } from "zod";
import { erstelleTvToken, pruefeTvPasswort, TV_COOKIE, TV_MAX_AGE } from "@/lib/auth";

const schema = z.object({ passwort: z.string().min(1) });

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });

  if (!pruefeTvPasswort(parsed.data.passwort)) {
    return NextResponse.json({ error: "Falsches Passwort." }, { status: 401 });
  }

  const token = await erstelleTvToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TV_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TV_MAX_AGE,
  });
  return res;
}
