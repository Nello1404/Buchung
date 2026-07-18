import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

const schema = z.object({ bookingId: z.string().min(1) });

// Markiert eine offene (manuelle) Zahlung als eingegangen – Stichtag = jetzt.
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });

  const payment = await prisma.payment.findUnique({ where: { bookingId: parsed.data.bookingId } });
  if (!payment) return NextResponse.json({ error: "Keine Zahlung gefunden." }, { status: 404 });
  if (payment.status === "BEZAHLT") return NextResponse.json({ ok: true, schonBezahlt: true });

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "BEZAHLT", bezahltAm: new Date() },
  });

  return NextResponse.json({ ok: true });
}
