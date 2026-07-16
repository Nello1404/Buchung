import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export class KapazitaetError extends Error {
  constructor(public readonly datum: Date) {
    super(`Kein Kontingent mehr frei am ${datum.toISOString().slice(0, 10)}.`);
    this.name = "KapazitaetError";
  }
}

type TransactionClient = Prisma.TransactionClient;

/**
 * Prüft für jeden Tag im Zeitraum, ob noch ein Platz frei ist (ohne zu reservieren).
 * Wird für die Live-Verfügbarkeitsanzeige im Buchungswidget genutzt.
 */
export async function verfuegbareTage(
  productId: string,
  tage: Date[]
): Promise<{ verfuegbar: boolean; ausgebuchteTage: Date[] }> {
  const rows = await prisma.capacityDay.findMany({
    where: { productId, date: { in: tage } },
  });

  const byDate = new Map(rows.map((r) => [r.date.getTime(), r]));
  const ausgebuchteTage: Date[] = [];

  for (const tag of tage) {
    const row = byDate.get(tag.getTime());
    if (!row || row.belegt >= row.kontingent) {
      ausgebuchteTage.push(tag);
    }
  }

  return { verfuegbar: ausgebuchteTage.length === 0, ausgebuchteTage };
}

/**
 * Reserviert atomar ein Kontingent-Slot für JEDEN Tag im Zeitraum, innerhalb der
 * übergebenen Transaktion. Die UPDATE-Bedingung `belegt < kontingent` sorgt dafür,
 * dass bei parallelen Anfragen auf den letzten freien Platz nur eine einzige
 * Transaktion erfolgreich ist (Postgres Row-Level-Locking durch das UPDATE selbst) –
 * schlägt die Reservierung für einen Tag fehl, wird die gesamte Transaktion
 * zurückgerollt und keine Buchung angelegt (harter Überbuchungsschutz).
 */
export async function reserviereKapazitaet(
  tx: TransactionClient,
  productId: string,
  tage: Date[]
): Promise<void> {
  for (const tag of tage) {
    const result = await tx.$executeRaw`
      UPDATE "CapacityDay"
      SET "belegt" = "belegt" + 1
      WHERE "productId" = ${productId}
        AND "date" = ${tag}
        AND "belegt" < "kontingent"
    `;
    if (result === 0) {
      throw new KapazitaetError(tag);
    }
  }
}

/** Gibt zuvor reservierte Kontingent-Slots frei (z. B. bei Storno). */
export async function gibKapazitaetFrei(
  tx: TransactionClient,
  productId: string,
  tage: Date[]
): Promise<void> {
  for (const tag of tage) {
    await tx.$executeRaw`
      UPDATE "CapacityDay"
      SET "belegt" = GREATEST("belegt" - 1, 0)
      WHERE "productId" = ${productId}
        AND "date" = ${tag}
    `;
  }
}
