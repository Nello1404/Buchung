import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { getFlugStatus, ankunftsDatum, flugTrackingKonfiguriert } from "@/lib/flights";

// Liefert den Rückflug-Status einer Buchung (für Admin- und Fahrer-Ansicht).
export async function GET(request: Request) {
  const guard = await requireStaff();
  if ("response" in guard) return guard.response;

  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("bookingId");
  if (!bookingId) return NextResponse.json({ error: "bookingId fehlt." }, { status: 400 });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { rueckflugnummer: true, abreise: true },
  });
  if (!booking) return NextResponse.json({ error: "Buchung nicht gefunden." }, { status: 404 });

  if (!booking.rueckflugnummer) {
    return NextResponse.json({ hatRueckflug: false, konfiguriert: flugTrackingKonfiguriert() });
  }

  const status = await getFlugStatus(booking.rueckflugnummer, ankunftsDatum(booking.abreise));
  return NextResponse.json({ hatRueckflug: true, ...status });
}
