import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { belegteTage } from "@/lib/date";
import { gibKapazitaetFrei } from "@/lib/capacity";
import { schreibeAudit } from "@/lib/finance";

/**
 * Löscht eine einzelne Buchung endgültig (v. a. für Testbuchungen). Gibt – sofern
 * die Buchung nicht ohnehin storniert war – das belegte Kontingent wieder frei,
 * löst verknüpfte Gutscheine und entfernt Fahrzeug/Zahlung/Addons/Protokolle
 * (per Cascade).
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, bookingNumber: true, status: true, productId: true, anreise: true, abreise: true },
  });
  if (!booking) return NextResponse.json({ error: "Buchung nicht gefunden." }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    // Stornierte Buchungen haben ihr Kontingent bereits freigegeben.
    if (booking.status !== "STORNIERT") {
      await gibKapazitaetFrei(tx, booking.productId, belegteTage(booking.anreise, booking.abreise));
    }
    await tx.voucher.updateMany({
      where: { redeemedBookingId: id },
      data: { redeemedBookingId: null, redeemedAt: null },
    });
    await tx.booking.delete({ where: { id } });
  });

  await schreibeAudit(guard.session.email, "buchung_geloescht", "Booking", id, {
    bookingNumber: booking.bookingNumber,
    status: booking.status,
  });
  return NextResponse.json({ ok: true });
}
