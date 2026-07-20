import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { setzeBuchungStatus, STATUS_FLOW } from "@/lib/status-flow";
import type { BookingStatus } from "@/generated/prisma/client";

const schema = z.object({
  // Zielstatus (optional – nur Stellplatz ändern ist auch erlaubt).
  status: z.enum(STATUS_FLOW as [string, ...string[]]).optional(),
  // Stellplatz/Reihe (Freitext). Leerstring = löschen.
  stellplatz: z.string().trim().max(120).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireStaff();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }
  const { status, stellplatz } = parsed.data;

  const booking = await prisma.booking.findUnique({ where: { id }, select: { status: true } });
  if (!booking) return NextResponse.json({ error: "Buchung nicht gefunden." }, { status: 404 });
  if (booking.status === "STORNIERT") {
    return NextResponse.json({ error: "Stornierte Buchung kann nicht geändert werden." }, { status: 409 });
  }
  if (!status && stellplatz === undefined) {
    return NextResponse.json({ error: "Nichts zu ändern." }, { status: 400 });
  }

  await setzeBuchungStatus(
    prisma,
    id,
    (status ?? booking.status) as BookingStatus,
    guard.session.email,
    stellplatz
  );

  return NextResponse.json({ ok: true });
}
