import type { Prisma, PrismaClient, BookingStatus } from "@/generated/prisma/client";

/**
 * Operativer Ablauf einer Buchung – lineare Reihenfolge vom bezahlten Auftrag bis
 * zur Rückgabe. ANGEFRAGT (vor Zahlung) und STORNIERT liegen außerhalb dieses Flows.
 */
export const STATUS_FLOW: BookingStatus[] = [
  "BEZAHLT",
  "UEBERGEBEN",
  "GEPARKT",
  "BEREITGESTELLT",
  "ABGESCHLOSSEN",
];

export const STATUS_FLOW_LABEL: Record<string, string> = {
  BEZAHLT: "Bezahlt / erwartet",
  UEBERGEBEN: "Auto übernommen",
  GEPARKT: "Geparkt",
  BEREITGESTELLT: "Bereitgestellt",
  ABGESCHLOSSEN: "Abgeschlossen",
};

/** Index im Flow (oder -1, falls nicht Teil des operativen Ablaufs). */
export function flowIndex(status: BookingStatus): number {
  return STATUS_FLOW.indexOf(status);
}

/** Nächster Schritt im Flow (oder null, wenn schon abgeschlossen / außerhalb). */
export function naechsterStatus(status: BookingStatus): BookingStatus | null {
  const i = flowIndex(status);
  if (i < 0 || i >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[i + 1];
}

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Setzt den Status einer Buchung, schreibt einen StatusEvent (Zeitleiste) und
 * optional den Stellplatz. Idempotent: Ist der Status bereits gesetzt, wird kein
 * doppelter Event angelegt (der Stellplatz wird dennoch aktualisiert, falls gegeben).
 */
export async function setzeBuchungStatus(
  db: Db,
  bookingId: string,
  status: BookingStatus,
  von: string | null,
  stellplatz?: string | null
): Promise<void> {
  const aktuell = await db.booking.findUnique({ where: { id: bookingId }, select: { status: true } });
  if (!aktuell) return;

  const data: Prisma.BookingUpdateInput = {};
  const statusWechsel = aktuell.status !== status;
  if (statusWechsel) data.status = status;
  if (stellplatz !== undefined) data.stellplatz = stellplatz;

  if (Object.keys(data).length > 0) {
    await db.booking.update({ where: { id: bookingId }, data });
  }
  if (statusWechsel) {
    await db.statusEvent.create({ data: { bookingId, status, von } });
  }
}
