import { prisma } from "@/lib/prisma";
import { baueICal, type ICalEvent } from "@/lib/ical";

// Öffentlicher, per geheimem Token abgesicherter Kalender-Feed (.ics) mit den
// Schichten eines Mitarbeiters. Zum Abonnieren in Google/Apple/Outlook.
export const dynamic = "force-dynamic";

function isoDatum(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function hhmmAusFeld(v: string): string {
  // vonZeit/bisZeit sind bereits "HH:MM"; defensiv auf 5 Zeichen kürzen.
  return /^\d{2}:\d{2}$/.test(v) ? v : v.slice(0, 5);
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const mitarbeiter = await prisma.mitarbeiter.findUnique({
    where: { feedToken: token },
    select: { id: true, name: true },
  });

  if (!mitarbeiter) {
    return new Response("Kalender nicht gefunden.", { status: 404 });
  }

  // Zeitfenster: vergangene 30 Tage bis 180 Tage in der Zukunft.
  const von = new Date();
  von.setUTCDate(von.getUTCDate() - 30);
  const bis = new Date();
  bis.setUTCDate(bis.getUTCDate() + 180);

  const schichten = await prisma.schicht.findMany({
    where: { mitarbeiterId: mitarbeiter.id, datum: { gte: von, lte: bis } },
    orderBy: { datum: "asc" },
  });

  const events: ICalEvent[] = schichten.map((s) => ({
    uid: `${s.id}@flyspot-valet.de`,
    datum: isoDatum(s.datum),
    vonZeit: hhmmAusFeld(s.vonZeit),
    bisZeit: hhmmAusFeld(s.bisZeit),
    titel: "FlySpot Einsatz",
    beschreibung: s.notiz,
  }));

  const ics = baueICal(`FlySpot Einsatzplan – ${mitarbeiter.name}`, events);

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="flyspot-einsatzplan.ics"`,
      "Cache-Control": "no-store",
    },
  });
}
