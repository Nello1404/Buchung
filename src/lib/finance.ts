import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function schreibeAudit(
  email: string,
  aktion: string,
  entity: string,
  entityId?: string,
  details?: Prisma.InputJsonValue
) {
  await prisma.auditLog.create({
    data: { email, aktion, entity, entityId, details: details ?? undefined },
  });
}

function monatsGrenzen(jahr: number, monat: number) {
  const von = new Date(Date.UTC(jahr, monat - 1, 1));
  const bis = new Date(Date.UTC(jahr, monat, 1));
  return { von, bis };
}

/**
 * Legt für jede aktive wiederkehrende Ausgabe die fehlenden Monats-Buchungen an
 * (vom Startmonat bis zum aktuellen Monat). Idempotent über (recurringId, periodeKey).
 */
export async function materialisiereWiederkehrende() {
  const recurrings = await prisma.recurringExpense.findMany({ where: { aktiv: true } });
  const jetzt = new Date();
  const aktJahr = jetzt.getUTCFullYear();
  const aktMonat = jetzt.getUTCMonth(); // 0-basiert

  for (const r of recurrings) {
    let jahr = r.startDatum.getUTCFullYear();
    let monat = r.startDatum.getUTCMonth();
    while (jahr < aktJahr || (jahr === aktJahr && monat <= aktMonat)) {
      const periodeKey = `${jahr}-${String(monat + 1).padStart(2, "0")}`;
      await prisma.expense.upsert({
        where: { recurringId_periodeKey: { recurringId: r.id, periodeKey } },
        update: {},
        create: {
          datum: new Date(Date.UTC(jahr, monat, 1)),
          betragCent: r.betragCent,
          categoryId: r.categoryId,
          notiz: `${r.name} (automatisch)`,
          erfasstVon: "system",
          recurringId: r.id,
          periodeKey,
        },
      });
      monat++;
      if (monat > 11) {
        monat = 0;
        jahr++;
      }
    }
  }
}

export interface Monatsuebersicht {
  jahr: number;
  monat: number;
  einnahmenBruttoCent: number;
  erstattetCent: number;
  einnahmenCent: number; // brutto - erstattet
  ausgabenCent: number;
  ergebnisCent: number;
  ruecklageProzent: number;
  ruecklageCent: number;
  kategorien: { name: string; betragCent: number }[];
}

export async function getMonatsuebersicht(jahr: number, monat: number): Promise<Monatsuebersicht> {
  await materialisiereWiederkehrende();
  const { von, bis } = monatsGrenzen(jahr, monat);

  const [zahlungen, ausgaben, settings] = await Promise.all([
    prisma.payment.aggregate({
      _sum: { betragCent: true, erstattetCent: true },
      where: { bezahltAm: { gte: von, lt: bis } },
    }),
    prisma.expense.findMany({
      where: { datum: { gte: von, lt: bis } },
      include: { category: true },
    }),
    prisma.settings.findUnique({ where: { id: "default" } }),
  ]);

  const einnahmenBrutto = zahlungen._sum.betragCent ?? 0;
  const erstattet = zahlungen._sum.erstattetCent ?? 0;
  const einnahmen = einnahmenBrutto - erstattet;
  const ausgabenCent = ausgaben.reduce((s, a) => s + a.betragCent, 0);
  const ergebnis = einnahmen - ausgabenCent;

  const katMap = new Map<string, number>();
  for (const a of ausgaben) katMap.set(a.category.name, (katMap.get(a.category.name) ?? 0) + a.betragCent);

  const ruecklageProzent = settings?.steuerRuecklageProzent ?? 25;
  const ruecklageCent = Math.round((Math.max(0, ergebnis) * ruecklageProzent) / 100);

  return {
    jahr,
    monat,
    einnahmenBruttoCent: einnahmenBrutto,
    erstattetCent: erstattet,
    einnahmenCent: einnahmen,
    ausgabenCent,
    ergebnisCent: ergebnis,
    ruecklageProzent,
    ruecklageCent,
    kategorien: [...katMap.entries()]
      .map(([name, betragCent]) => ({ name, betragCent }))
      .sort((a, b) => b.betragCent - a.betragCent),
  };
}

/** Kumulierter Ergebnisverlauf (Liquidität) über die letzten `monate` Monate. */
export async function getLiquiditaet(monate = 12): Promise<{ bucket: string; kumuliertCent: number; monatCent: number }[]> {
  const jetzt = new Date();
  const startJahr = jetzt.getUTCFullYear();
  const startMonat = jetzt.getUTCMonth();
  const von = new Date(Date.UTC(startJahr, startMonat - (monate - 1), 1));
  const bis = new Date(Date.UTC(startJahr, startMonat + 1, 1));

  const [zahlungen, ausgaben] = await Promise.all([
    prisma.payment.findMany({
      where: { bezahltAm: { gte: von, lt: bis } },
      select: { betragCent: true, erstattetCent: true, bezahltAm: true },
    }),
    prisma.expense.findMany({ where: { datum: { gte: von, lt: bis } }, select: { betragCent: true, datum: true } }),
  ]);

  const monat = new Map<string, number>();
  for (let i = 0; i < monate; i++) {
    const d = new Date(Date.UTC(startJahr, startMonat - (monate - 1) + i, 1));
    monat.set(d.toISOString().slice(0, 7), 0);
  }
  for (const z of zahlungen) {
    if (!z.bezahltAm) continue;
    const key = z.bezahltAm.toISOString().slice(0, 7);
    if (monat.has(key)) monat.set(key, monat.get(key)! + z.betragCent - z.erstattetCent);
  }
  for (const a of ausgaben) {
    const key = a.datum.toISOString().slice(0, 7);
    if (monat.has(key)) monat.set(key, monat.get(key)! - a.betragCent);
  }

  let kumuliert = 0;
  return [...monat.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([bucket, monatCent]) => {
      kumuliert += monatCent;
      return { bucket, monatCent, kumuliertCent: kumuliert };
    });
}
