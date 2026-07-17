import { prisma } from "@/lib/prisma";

export type Ampel = "gruen" | "gelb" | "rot" | "neutral";

/** Höher = besser (Umsatz, Auslastung, Ergebnis): Ist im Verhältnis zum Plan. */
export function ampelHoeher(ist: number, plan: number): Ampel {
  if (plan <= 0) return "neutral";
  const q = (ist / plan) * 100;
  if (q >= 95) return "gruen";
  if (q >= 80) return "gelb";
  return "rot";
}

/** Niedriger = besser (Kosten): Ist im Verhältnis zum Plan. */
export function ampelNiedriger(ist: number, plan: number): Ampel {
  if (plan <= 0) return "neutral";
  const q = (ist / plan) * 100;
  if (q <= 105) return "gruen";
  if (q <= 120) return "gelb";
  return "rot";
}

async function auslastungIstMonat(jahr: number, monat: number) {
  const von = new Date(Date.UTC(jahr, monat - 1, 1));
  const bis = new Date(Date.UTC(jahr, monat, 1));
  const rows = await prisma.capacityDay.findMany({
    where: { date: { gte: von, lt: bis } },
    include: { product: true },
  });
  const acc: Record<string, { summe: number; anzahl: number }> = {};
  for (const r of rows) {
    if (r.kontingent <= 0) continue;
    const key = r.product.code;
    acc[key] ??= { summe: 0, anzahl: 0 };
    acc[key].summe += (r.belegt / r.kontingent) * 100;
    acc[key].anzahl += 1;
  }
  const mittel = (k: string) => (acc[k]?.anzahl ? Math.round(acc[k].summe / acc[k].anzahl) : 0);
  return { valet: mittel("VALET"), shuttle: mittel("SHUTTLE") };
}

export interface PlanIst {
  jahr: number;
  monat: number;
  plan: { auslastungValetProzent: number; auslastungShuttleProzent: number; umsatzCent: number; kostenCent: number };
  ist: { auslastungValetProzent: number; auslastungShuttleProzent: number; umsatzCent: number; kostenCent: number; ergebnisCent: number };
  ampeln: { auslastungValet: Ampel; auslastungShuttle: Ampel; umsatz: Ampel; kosten: Ampel; ergebnis: Ampel };
}

export async function getPlanIst(jahr: number, monat: number): Promise<PlanIst> {
  const von = new Date(Date.UTC(jahr, monat - 1, 1));
  const bis = new Date(Date.UTC(jahr, monat, 1));

  const [plan, zahlungen, ausgaben, auslastung] = await Promise.all([
    prisma.planMonth.findUnique({ where: { jahr_monat: { jahr, monat } } }),
    prisma.payment.aggregate({ _sum: { betragCent: true, erstattetCent: true }, where: { bezahltAm: { gte: von, lt: bis } } }),
    prisma.expense.aggregate({ _sum: { betragCent: true }, where: { datum: { gte: von, lt: bis } } }),
    auslastungIstMonat(jahr, monat),
  ]);

  const istUmsatz = (zahlungen._sum.betragCent ?? 0) - (zahlungen._sum.erstattetCent ?? 0);
  const istKosten = ausgaben._sum.betragCent ?? 0;
  const istErgebnis = istUmsatz - istKosten;

  const planWerte = {
    auslastungValetProzent: plan?.auslastungValetProzent ?? 0,
    auslastungShuttleProzent: plan?.auslastungShuttleProzent ?? 0,
    umsatzCent: plan?.umsatzCent ?? 0,
    kostenCent: plan?.kostenCent ?? 0,
  };
  const planErgebnis = planWerte.umsatzCent - planWerte.kostenCent;

  return {
    jahr,
    monat,
    plan: planWerte,
    ist: {
      auslastungValetProzent: auslastung.valet,
      auslastungShuttleProzent: auslastung.shuttle,
      umsatzCent: istUmsatz,
      kostenCent: istKosten,
      ergebnisCent: istErgebnis,
    },
    ampeln: {
      auslastungValet: ampelHoeher(auslastung.valet, planWerte.auslastungValetProzent),
      auslastungShuttle: ampelHoeher(auslastung.shuttle, planWerte.auslastungShuttleProzent),
      umsatz: ampelHoeher(istUmsatz, planWerte.umsatzCent),
      kosten: ampelNiedriger(istKosten, planWerte.kostenCent),
      ergebnis: ampelHoeher(istErgebnis, planErgebnis),
    },
  };
}
