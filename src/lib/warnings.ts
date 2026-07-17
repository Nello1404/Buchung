import { prisma } from "@/lib/prisma";
import { berlinKalendertag } from "@/lib/date";

export interface Warnung {
  typ: "auslastung_niedrig" | "tag_voll" | "stornoquote" | "budget";
  schwere: "info" | "warnung";
  text: string;
}

const VORSCHAU_TAGE = 14;

export async function getWarnungen(): Promise<Warnung[]> {
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  const grenzeAuslastung = settings?.warnAuslastungProzent ?? 40;
  const grenzeTagVoll = settings?.warnTagVollProzent ?? 90;
  const grenzeStorno = settings?.warnStornoquoteProzent ?? 20;

  const heute = berlinKalendertag(new Date());
  const bis14 = new Date(heute);
  bis14.setUTCDate(bis14.getUTCDate() + VORSCHAU_TAGE);

  const monatVon = new Date(Date.UTC(heute.getUTCFullYear(), heute.getUTCMonth(), 1));
  const monatBis = new Date(Date.UTC(heute.getUTCFullYear(), heute.getUTCMonth() + 1, 1));

  const [capacity, zahlungenMonat, buchungenMonat, kategorien, ausgabenMonat] = await Promise.all([
    prisma.capacityDay.findMany({ where: { date: { gte: heute, lt: bis14 } }, include: { product: true } }),
    prisma.payment.count({ where: { bezahltAm: { gte: monatVon, lt: monatBis } } }),
    prisma.booking.findMany({ where: { createdAt: { gte: monatVon, lt: monatBis } }, select: { status: true } }),
    prisma.expenseCategory.findMany({ where: { active: true, monatsBudgetCent: { not: null } } }),
    prisma.expense.findMany({ where: { datum: { gte: monatVon, lt: monatBis } }, select: { categoryId: true, betragCent: true } }),
  ]);

  const warnungen: Warnung[] = [];

  // 1) Durchschnittliche Auslastung je Produkt in den nächsten 14 Tagen
  const acc: Record<string, { summe: number; anzahl: number; name: string }> = {};
  const vollTage: Record<string, number> = {};
  for (const c of capacity) {
    if (c.kontingent <= 0) continue;
    const prozent = (c.belegt / c.kontingent) * 100;
    const key = c.product.code;
    acc[key] ??= { summe: 0, anzahl: 0, name: key === "VALET" ? "Valet" : "Shuttle" };
    acc[key].summe += prozent;
    acc[key].anzahl += 1;
    if (prozent >= grenzeTagVoll) vollTage[key] = (vollTage[key] ?? 0) + 1;
  }
  for (const key of Object.keys(acc)) {
    const schnitt = Math.round(acc[key].summe / acc[key].anzahl);
    if (schnitt < grenzeAuslastung) {
      warnungen.push({
        typ: "auslastung_niedrig",
        schwere: "warnung",
        text: `${acc[key].name}: Auslastung nächste 14 Tage nur ${schnitt}% (Schwelle ${grenzeAuslastung}%). Marketing/Aktion prüfen.`,
      });
    }
  }
  // 2) Einzelne fast volle Tage (Preis-Chance)
  for (const key of Object.keys(vollTage)) {
    warnungen.push({
      typ: "tag_voll",
      schwere: "info",
      text: `${acc[key]?.name ?? key}: ${vollTage[key]} Tag(e) in den nächsten 14 Tagen ≥ ${grenzeTagVoll}% belegt – Chance, Preise anzuheben.`,
    });
  }

  // 3) Stornoquote aktueller Monat
  const storniert = buchungenMonat.filter((b) => b.status === "STORNIERT").length;
  const quote = buchungenMonat.length > 0 ? Math.round((storniert / buchungenMonat.length) * 100) : 0;
  if (quote > grenzeStorno) {
    warnungen.push({
      typ: "stornoquote",
      schwere: "warnung",
      text: `Stornoquote diesen Monat ${quote}% (Schwelle ${grenzeStorno}%). Ursachen prüfen.`,
    });
  }
  void zahlungenMonat;

  // 4) Kategorie über Budget
  const summeProKat: Record<string, number> = {};
  for (const a of ausgabenMonat) summeProKat[a.categoryId] = (summeProKat[a.categoryId] ?? 0) + a.betragCent;
  for (const k of kategorien) {
    const budget = k.monatsBudgetCent ?? 0;
    const ist = summeProKat[k.id] ?? 0;
    if (budget > 0 && ist > budget) {
      warnungen.push({
        typ: "budget",
        schwere: "warnung",
        text: `Kategorie „${k.name}" über Budget: ${(ist / 100).toFixed(0)} € von ${(budget / 100).toFixed(0)} €.`,
      });
    }
  }

  return warnungen;
}
