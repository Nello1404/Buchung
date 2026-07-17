import { prisma } from "@/lib/prisma";
import { anzahlTage, berlinKalendertag } from "@/lib/date";
import { ustAusweis } from "@/lib/pricing";

export type Granularitaet = "tag" | "woche" | "monat";
export type Preset = "tag" | "woche" | "monat" | "jahr" | "custom";

/** Löst Preset bzw. Von/Bis in konkrete UTC-Tagesgrenzen (Europe/Berlin) auf. */
export function aufloesenZeitraum(
  preset: Preset,
  vonISO?: string,
  bisISO?: string
): { von: Date; bis: Date; granularitaet: Granularitaet } {
  const heute = berlinKalendertag(new Date());

  if (preset === "custom" && vonISO && bisISO) {
    const [jv, mv, tv] = vonISO.split("-").map(Number);
    const [jb, mb, tb] = bisISO.split("-").map(Number);
    const von = new Date(Date.UTC(jv, mv - 1, tv));
    const bis = new Date(Date.UTC(jb, mb - 1, tb));
    bis.setUTCDate(bis.getUTCDate() + 1); // inklusive Bis-Tag
    const tage = Math.round((bis.getTime() - von.getTime()) / 86400000);
    const gran: Granularitaet = tage <= 31 ? "tag" : tage <= 180 ? "woche" : "monat";
    return { von, bis, granularitaet: gran };
  }

  if (preset === "woche") {
    const von = new Date(heute);
    const day = von.getUTCDay() || 7;
    von.setUTCDate(von.getUTCDate() - day + 1);
    const bis = new Date(von);
    bis.setUTCDate(bis.getUTCDate() + 7);
    return { von, bis, granularitaet: "tag" };
  }
  if (preset === "monat") {
    const von = new Date(Date.UTC(heute.getUTCFullYear(), heute.getUTCMonth(), 1));
    const bis = new Date(Date.UTC(heute.getUTCFullYear(), heute.getUTCMonth() + 1, 1));
    return { von, bis, granularitaet: "tag" };
  }
  if (preset === "jahr") {
    const von = new Date(Date.UTC(heute.getUTCFullYear(), 0, 1));
    const bis = new Date(Date.UTC(heute.getUTCFullYear() + 1, 0, 1));
    return { von, bis, granularitaet: "monat" };
  }
  // "tag"
  const bis = new Date(heute);
  bis.setUTCDate(bis.getUTCDate() + 1);
  return { von: heute, bis, granularitaet: "tag" };
}

export interface QuelleSumme {
  quelle: string;
  betragCent: number;
}

export interface ZeitreihenPunkt {
  bucket: string; // z. B. "2026-07-01" oder "2026-07"
  betragCent: number;
}

export interface UmsatzErgebnis {
  von: string;
  bis: string;
  bruttoCent: number;
  erstattetCent: number;
  nettoNachStornoCent: number; // Brutto - Erstattungen
  ustAusweis: { nettoCent: number; ustCent: number; bruttoCent: number };
  quellen: QuelleSumme[];
  zeitreihe: ZeitreihenPunkt[];
  kennzahlen: {
    anzahlBuchungen: number;
    stornierteAnzahl: number;
    stornoquoteProzent: number;
    oErloesProFahrzeugTagCent: number;
    oBuchungsdauerTage: number;
    oAddonWarenkorbCent: number;
  };
  vergleich: {
    vorzeitraumBruttoCent: number;
    vorjahrBruttoCent: number;
  };
}

interface PaidRow {
  betragCent: number;
  erstattetCent: number;
  bezahltAm: Date | null;
  booking: {
    status: string;
    anreise: Date;
    abreise: Date;
    preisTageCent: number;
    gutscheinRabattCent: number;
    product: { code: string };
    addons: { nameSnapshot: string; preisCentSnapshot: number }[];
  };
}

async function ladePaidRows(von: Date, bis: Date): Promise<PaidRow[]> {
  return prisma.payment.findMany({
    where: { bezahltAm: { gte: von, lt: bis } },
    select: {
      betragCent: true,
      erstattetCent: true,
      bezahltAm: true,
      booking: {
        select: {
          status: true,
          anreise: true,
          abreise: true,
          preisTageCent: true,
          gutscheinRabattCent: true,
          product: { select: { code: true } },
          addons: { select: { nameSnapshot: true, preisCentSnapshot: true } },
        },
      },
    },
  });
}

async function bruttoImZeitraum(von: Date, bis: Date): Promise<number> {
  const agg = await prisma.payment.aggregate({
    _sum: { betragCent: true },
    where: { bezahltAm: { gte: von, lt: bis } },
  });
  return agg._sum.betragCent ?? 0;
}

function bucketKey(d: Date, gran: Granularitaet): string {
  const iso = d.toISOString();
  if (gran === "monat") return iso.slice(0, 7);
  if (gran === "woche") {
    // ISO-Woche (Montag-basiert)
    const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = dt.getUTCDay() || 7;
    dt.setUTCDate(dt.getUTCDate() - day + 1);
    return dt.toISOString().slice(0, 10);
  }
  return iso.slice(0, 10);
}

export async function berechneUmsatz(
  von: Date,
  bis: Date,
  granularitaet: Granularitaet
): Promise<UmsatzErgebnis> {
  const rows = await ladePaidRows(von, bis);

  let bruttoCent = 0;
  let erstattetCent = 0;
  let parkValet = 0;
  let parkShuttle = 0;
  let gutscheinRabatt = 0;
  const addonMap = new Map<string, number>();
  const zeitMap = new Map<string, number>();

  let summeTage = 0;
  let addonUmsatz = 0;
  let buchungenMitAddon = 0;
  let stornierteAnzahl = 0;

  for (const r of rows) {
    bruttoCent += r.betragCent;
    erstattetCent += r.erstattetCent;

    if (r.booking.product.code === "VALET") parkValet += r.booking.preisTageCent;
    else parkShuttle += r.booking.preisTageCent;

    gutscheinRabatt += r.booking.gutscheinRabattCent;

    for (const a of r.booking.addons) {
      addonMap.set(a.nameSnapshot, (addonMap.get(a.nameSnapshot) ?? 0) + a.preisCentSnapshot);
      addonUmsatz += a.preisCentSnapshot;
    }
    if (r.booking.addons.length > 0) buchungenMitAddon++;

    summeTage += anzahlTage(r.booking.anreise, r.booking.abreise);
    if (r.booking.status === "STORNIERT") stornierteAnzahl++;

    if (r.bezahltAm) {
      const key = bucketKey(r.bezahltAm, granularitaet);
      zeitMap.set(key, (zeitMap.get(key) ?? 0) + r.betragCent);
    }
  }

  const quellen: QuelleSumme[] = [
    { quelle: "Valet – Parken", betragCent: parkValet },
    { quelle: "Shuttle – Parken", betragCent: parkShuttle },
    ...[...addonMap.entries()].map(([quelle, betragCent]) => ({ quelle, betragCent })),
  ];
  if (gutscheinRabatt > 0) quellen.push({ quelle: "Gutschein-Rabatt", betragCent: -gutscheinRabatt });

  const anzahlBuchungen = rows.length;
  const [vorzeitraumBrutto, vorjahrBrutto] = await Promise.all([
    (() => {
      const laenge = bis.getTime() - von.getTime();
      return bruttoImZeitraum(new Date(von.getTime() - laenge), von);
    })(),
    (() => {
      const vorVon = new Date(von);
      vorVon.setUTCFullYear(vorVon.getUTCFullYear() - 1);
      const vorBis = new Date(bis);
      vorBis.setUTCFullYear(vorBis.getUTCFullYear() - 1);
      return bruttoImZeitraum(vorVon, vorBis);
    })(),
  ]);

  return {
    von: von.toISOString(),
    bis: bis.toISOString(),
    bruttoCent,
    erstattetCent,
    nettoNachStornoCent: bruttoCent - erstattetCent,
    ustAusweis: ((): { nettoCent: number; ustCent: number; bruttoCent: number } => {
      const u = ustAusweis(bruttoCent);
      return { nettoCent: u.nettoCent, ustCent: u.ustCent, bruttoCent: u.bruttoCent };
    })(),
    quellen: quellen.sort((a, b) => b.betragCent - a.betragCent),
    zeitreihe: [...zeitMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([bucket, betragCent]) => ({ bucket, betragCent })),
    kennzahlen: {
      anzahlBuchungen,
      stornierteAnzahl,
      stornoquoteProzent: anzahlBuchungen > 0 ? Math.round((stornierteAnzahl / anzahlBuchungen) * 100) : 0,
      oErloesProFahrzeugTagCent: summeTage > 0 ? Math.round(bruttoCent / summeTage) : 0,
      oBuchungsdauerTage: anzahlBuchungen > 0 ? Math.round((summeTage / anzahlBuchungen) * 10) / 10 : 0,
      oAddonWarenkorbCent: buchungenMitAddon > 0 ? Math.round(addonUmsatz / buchungenMitAddon) : 0,
    },
    vergleich: {
      vorzeitraumBruttoCent: vorzeitraumBrutto,
      vorjahrBruttoCent: vorjahrBrutto,
    },
  };
}
