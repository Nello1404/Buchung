import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendeServiceAnfrageTeam, sendeServiceAnfrageKunde } from "@/lib/email";

function clean(v: unknown, max = 500): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

/** Öffentliche Service-Anfrage: speichern + Team und Kunde benachrichtigen. */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 160);
  const leistungen = clean(body.leistungen, 500);

  if (!name || !email || !leistungen) {
    return NextResponse.json(
      { error: "Bitte Name, E-Mail und mindestens eine Leistung angeben." },
      { status: 400 }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Bitte eine gültige E-Mail-Adresse angeben." }, { status: 400 });
  }

  const telefon = clean(body.telefon, 60);
  const kennzeichen = clean(body.kennzeichen, 20);
  const fahrzeug = clean(body.fahrzeug, 120);
  const wunschtermin = clean(body.wunschtermin, 120);
  const nachricht = clean(body.nachricht, 2000);

  const anfrage = await prisma.serviceAnfrage.create({
    data: { name, email, telefon, kennzeichen, fahrzeug, wunschtermin, leistungen, nachricht },
  });

  // E-Mails sind Best-Effort – eine Zustellprobleme darf die Anfrage nicht scheitern lassen.
  const an = process.env.SERVICE_EMAIL || process.env.REPORT_EMAIL || "service@flyspot-valet.de";
  try {
    await sendeServiceAnfrageTeam({
      an,
      name,
      email,
      telefon,
      kennzeichen,
      fahrzeug,
      wunschtermin,
      leistungen,
      nachricht,
      erstelltAm: anfrage.createdAt,
    });
    await sendeServiceAnfrageKunde({ an: email, name, leistungen });
  } catch (e) {
    console.error("Service-Anfrage: E-Mail-Versand fehlgeschlagen", e);
  }

  return NextResponse.json({ ok: true });
}
