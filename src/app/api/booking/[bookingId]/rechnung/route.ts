import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { baueRechnungsPdfFuerBuchung } from "@/lib/invoice";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;

  const pdf = await baueRechnungsPdfFuerBuchung(bookingId);
  if (!pdf) {
    return NextResponse.json({ error: "Rechnung nicht verfügbar." }, { status: 404 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, select: { bookingNumber: true } });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Rechnung-${booking?.bookingNumber ?? bookingId}.pdf"`,
    },
  });
}
