import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { schreibeAudit } from "@/lib/finance";

/**
 * Wartung (Testphase): löscht alle stornierten Buchungen samt zugehöriger
 * Fahrzeug-/Zahlungs-/Addon-Datensätze (Cascade). Zuvor werden Gutscheine, die
 * auf eine solche Buchung verweisen, wieder freigegeben.
 */
export async function POST() {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const stornierte = await prisma.booking.findMany({
    where: { status: "STORNIERT" },
    select: { id: true },
  });
  const ids = stornierte.map((b) => b.id);
  if (ids.length === 0) return NextResponse.json({ ok: true, geloescht: 0 });

  await prisma.$transaction([
    prisma.voucher.updateMany({
      where: { redeemedBookingId: { in: ids } },
      data: { redeemedBookingId: null, redeemedAt: null },
    }),
    prisma.booking.deleteMany({ where: { id: { in: ids } } }),
  ]);

  await schreibeAudit(guard.session.email, "testdaten_aufgeraeumt", "Booking", undefined, { anzahl: ids.length });
  return NextResponse.json({ ok: true, geloescht: ids.length });
}
