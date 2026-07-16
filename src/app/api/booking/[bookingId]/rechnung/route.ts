import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { erzeugeRechnungsPdf } from "@/lib/invoice";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { customer: true, product: true, addons: true },
  });

  if (!booking || booking.status === "ANGEFRAGT" || booking.status === "STORNIERT") {
    return NextResponse.json({ error: "Rechnung nicht verfügbar." }, { status: 404 });
  }

  const positionen = [
    { bezeichnung: `${booking.product.name} – Parkgebühr`, preisCent: booking.preisTageCent },
    ...booking.addons.map((a) => ({ bezeichnung: a.nameSnapshot, preisCent: a.preisCentSnapshot })),
  ];
  if (booking.gutscheinRabattCent > 0) {
    positionen.push({ bezeichnung: "Treue-Gutschein", preisCent: -booking.gutscheinRabattCent });
  }

  const pdf = await erzeugeRechnungsPdf({
    bookingNumber: booking.bookingNumber,
    rechnungsdatum: booking.updatedAt,
    kundeName: booking.customer.name,
    kundeEmail: booking.customer.email,
    positionen,
    preisGesamtCent: booking.preisGesamtCent,
  });

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Rechnung-${booking.bookingNumber}.pdf"`,
    },
  });
}
