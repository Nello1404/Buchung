import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { baueWochenreportDaten } from "@/lib/wochenreport";
import { sendeWochenreport } from "@/lib/email";

// Wird von Vercel Cron aufgerufen (Authorization: Bearer <CRON_SECRET>) oder
// manuell von einem angemeldeten Admin (zum Testen). Sendet den Wochenreport
// an die Geschäftsführung.
function cronAutorisiert(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function verarbeite(request: Request) {
  const erlaubt = cronAutorisiert(request) || (await getSession()) !== null;
  if (!erlaubt) {
    return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
  }

  const daten = await baueWochenreportDaten();
  const an = process.env.REPORT_EMAIL || "management@flyspot-valet.de";
  await sendeWochenreport({ an, ...daten });

  return NextResponse.json({ ok: true, an, zeitraum: `${daten.vonISO} – ${daten.bisISO}` });
}

export async function GET(request: Request) {
  return verarbeite(request);
}

// Manuelles Auslösen aus dem Cockpit (angemeldeter Admin).
export async function POST(request: Request) {
  return verarbeite(request);
}
