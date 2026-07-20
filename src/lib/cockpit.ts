import { prisma } from "@/lib/prisma";
import { berlinKalendertag } from "@/lib/date";
import type { BookingStatus, ProductCode } from "@/generated/prisma/client";

// Statusgruppen für die Cockpit-Logik
const ANGEKOMMEN: BookingStatus[] = ["UEBERGEBEN", "GEPARKT", "BEREITGESTELLT", "ABGESCHLOSSEN"];
const AUF_PLATZ: BookingStatus[] = ["UEBERGEBEN", "GEPARKT", "BEREITGESTELLT"];

// Ampel-Schwellen (Auslastung in %). Später im Admin pflegbar.
export const AMPEL = { gruenBis: 60, gelbBis: 85 };

export function ampelFarbe(auslastungProzent: number): "gruen" | "gelb" | "rot" {
  if (auslastungProzent <= AMPEL.gruenBis) return "gruen";
  if (auslastungProzent <= AMPEL.gelbBis) return "gelb";
  return "rot";
}

function tagesbereich(offsetTage = 0) {
  const von = berlinKalendertag(new Date());
  von.setUTCDate(von.getUTCDate() + offsetTage);
  const bis = new Date(von);
  bis.setUTCDate(bis.getUTCDate() + 1);
  return { von, bis };
}

export interface HeuteKennzahlen {
  ankuenfteOffen: number;
  ankuenfteErledigt: number;
  abholungenOffen: number;
  abholungenErledigt: number;
  physischeBelegung: number;
  auslastung: { code: ProductCode; name: string; belegt: number; kontingent: number; prozent: number }[];
}

export async function getHeute(): Promise<HeuteKennzahlen> {
  const { von, bis } = tagesbereich(0);

  const [ankuenfte, abholungen, aufPlatz, capacity] = await Promise.all([
    prisma.booking.findMany({
      where: { anreise: { gte: von, lt: bis }, status: { not: "STORNIERT" } },
      select: { status: true },
    }),
    prisma.booking.findMany({
      where: { abreise: { gte: von, lt: bis }, status: { not: "STORNIERT" } },
      select: { status: true },
    }),
    prisma.booking.count({ where: { status: { in: AUF_PLATZ } } }),
    prisma.capacityDay.findMany({ where: { date: von }, include: { product: true } }),
  ]);

  const ankuenfteErledigt = ankuenfte.filter((b) => ANGEKOMMEN.includes(b.status)).length;
  const abholungenErledigt = abholungen.filter((b) => b.status === "ABGESCHLOSSEN").length;

  return {
    ankuenfteOffen: ankuenfte.length - ankuenfteErledigt,
    ankuenfteErledigt,
    abholungenOffen: abholungen.length - abholungenErledigt,
    abholungenErledigt,
    physischeBelegung: aufPlatz,
    auslastung: capacity
      .sort((a, b) => a.product.code.localeCompare(b.product.code))
      .map((c) => ({
        code: c.product.code,
        name: c.product.name,
        belegt: c.belegt,
        kontingent: c.kontingent,
        prozent: c.kontingent > 0 ? Math.round((c.belegt / c.kontingent) * 100) : 0,
      })),
  };
}

export interface HeatmapTag {
  datum: string; // YYYY-MM-DD
  produkte: { code: ProductCode; belegt: number; kontingent: number; prozent: number; farbe: string }[];
}

export async function getHeatmap(wochen = 8): Promise<HeatmapTag[]> {
  const start = berlinKalendertag(new Date());
  const ende = new Date(start);
  ende.setUTCDate(ende.getUTCDate() + wochen * 7);

  const rows = await prisma.capacityDay.findMany({
    where: { date: { gte: start, lt: ende } },
    include: { product: true },
    orderBy: { date: "asc" },
  });

  const proTag = new Map<string, HeatmapTag>();
  for (const r of rows) {
    const key = r.date.toISOString().slice(0, 10);
    if (!proTag.has(key)) proTag.set(key, { datum: key, produkte: [] });
    const prozent = r.kontingent > 0 ? Math.round((r.belegt / r.kontingent) * 100) : 0;
    proTag.get(key)!.produkte.push({
      code: r.product.code,
      belegt: r.belegt,
      kontingent: r.kontingent,
      prozent,
      farbe: ampelFarbe(prozent),
    });
  }

  // Alle Tage im Bereich (auch ohne CapacityDay) auffüllen
  const alle: HeatmapTag[] = [];
  for (let i = 0; i < wochen * 7; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    alle.push(proTag.get(key) ?? { datum: key, produkte: [] });
  }
  return alle;
}

export interface FeedEintrag {
  id: string;
  bookingNumber: string;
  kunde: string;
  produkt: ProductCode;
  status: BookingStatus;
  betragCent: number;
  zeit: string; // ISO
  storniert: boolean;
}

export async function getFeed(limit = 15): Promise<FeedEintrag[]> {
  const rows = await prisma.booking.findMany({
    include: { customer: true, product: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return rows.map((b) => ({
    id: b.id,
    bookingNumber: b.bookingNumber,
    kunde: b.customer.name,
    produkt: b.product.code,
    status: b.status,
    betragCent: b.preisGesamtCent,
    zeit: (b.storniertAm ?? b.updatedAt).toISOString(),
    storniert: b.status === "STORNIERT",
  }));
}

export interface TagDetailEintrag {
  id: string;
  bookingNumber: string;
  kunde: string;
  kennzeichen: string | null;
  produkt: ProductCode;
  status: BookingStatus;
  flugnummer: string | null;
  stellplatz: string | null;
  uhrzeitISO: string;
  addons: string[];
}

export async function getTagDetail(datumISO: string) {
  const [j, m, t] = datumISO.split("-").map(Number);
  const von = new Date(Date.UTC(j, m - 1, t));
  const bis = new Date(von);
  bis.setUTCDate(bis.getUTCDate() + 1);

  const [ankuenfte, abholungen] = await Promise.all([
    prisma.booking.findMany({
      where: { anreise: { gte: von, lt: bis }, status: { not: "STORNIERT" } },
      include: { customer: true, vehicle: true, product: true, addons: true },
      orderBy: { anreise: "asc" },
    }),
    prisma.booking.findMany({
      where: { abreise: { gte: von, lt: bis }, status: { not: "STORNIERT" } },
      include: { customer: true, vehicle: true, product: true, addons: true },
      orderBy: { abreise: "asc" },
    }),
  ]);

  const map = (b: (typeof ankuenfte)[number], zeit: Date): TagDetailEintrag => ({
    id: b.id,
    bookingNumber: b.bookingNumber,
    kunde: b.customer.name,
    kennzeichen: b.vehicle?.kennzeichen ?? null,
    produkt: b.product.code,
    status: b.status,
    flugnummer: b.flugnummer,
    stellplatz: b.stellplatz,
    uhrzeitISO: zeit.toISOString(),
    addons: b.addons.map((a) => a.nameSnapshot),
  });

  return {
    datum: datumISO,
    ankuenfte: ankuenfte.map((b) => map(b, b.anreise)),
    abholungen: abholungen.map((b) => map(b, b.abreise)),
  };
}

export async function getCockpitData() {
  const [heute, heatmap, feed] = await Promise.all([getHeute(), getHeatmap(8), getFeed(15)]);
  return { heute, heatmap, feed, stand: new Date().toISOString() };
}

/** TV-Modus: nur betriebliche Daten, KEINE Umsätze/Geldbeträge. */
export async function getTvData() {
  const heute = await getHeute();
  const heuteISO = berlinKalendertag(new Date()).toISOString().slice(0, 10);
  const detail = await getTagDetail(heuteISO);
  return {
    heute: {
      ankuenfteOffen: heute.ankuenfteOffen,
      ankuenfteErledigt: heute.ankuenfteErledigt,
      abholungenOffen: heute.abholungenOffen,
      abholungenErledigt: heute.abholungenErledigt,
      physischeBelegung: heute.physischeBelegung,
      auslastung: heute.auslastung.map((a) => ({ code: a.code, prozent: a.prozent, belegt: a.belegt, kontingent: a.kontingent })),
    },
    ankuenfte: detail.ankuenfte,
    abholungen: detail.abholungen,
    stand: new Date().toISOString(),
  };
}

export type StatusAktion = "ankunft" | "abholung";

/**
 * Übergangslösung bis zum vollen Übergabeprotokoll (Portal-Phase 3):
 * "ankunft" markiert das Auto als übernommen/geparkt (Status GEPARKT),
 * "abholung" markiert die Rückgabe als erledigt (Status ABGESCHLOSSEN).
 */
export async function setzeStatus(bookingId: string, aktion: StatusAktion) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false as const, error: "Buchung nicht gefunden." };
  if (booking.status === "STORNIERT") return { ok: false as const, error: "Buchung ist storniert." };

  const neuerStatus: BookingStatus = aktion === "ankunft" ? "GEPARKT" : "ABGESCHLOSSEN";
  await prisma.booking.update({ where: { id: bookingId }, data: { status: neuerStatus } });
  return { ok: true as const, status: neuerStatus };
}
