import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { ProductCode } from "@/generated/prisma/client";

const createSchema = z.object({
  productCode: z.enum(["VALET", "SHUTTLE"]),
  vehicleClassId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  vonDatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bisDatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preisProTagCent: z.number().int().min(0).max(1_000_000),
});

const deleteSchema = z.object({ id: z.string().min(1) });

/** Wandelt "YYYY-MM-DD" in einen reinen UTC-Mitternachts-Zeitstempel (passend zu @db.Date). */
function toDbDate(iso: string): Date {
  const [j, m, t] = iso.split("-").map(Number);
  return new Date(Date.UTC(j, m - 1, t));
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });

  const [product, vehicleClass] = await Promise.all([
    prisma.product.findUnique({ where: { code: parsed.data.productCode as ProductCode } }),
    prisma.vehicleClass.findUnique({ where: { id: parsed.data.vehicleClassId } }),
  ]);
  if (!product) return NextResponse.json({ error: "Produkt nicht gefunden." }, { status: 404 });
  if (!vehicleClass) return NextResponse.json({ error: "Fahrzeugklasse nicht gefunden." }, { status: 404 });

  const von = toDbDate(parsed.data.vonDatum);
  const bis = toDbDate(parsed.data.bisDatum);
  if (bis.getTime() < von.getTime()) {
    return NextResponse.json({ error: "Bis-Datum liegt vor Von-Datum." }, { status: 400 });
  }

  await prisma.seasonRate.create({
    data: {
      productId: product.id,
      vehicleClassId: vehicleClass.id,
      name: parsed.data.name,
      startDate: von,
      endDate: bis,
      preisProTagCent: parsed.data.preisProTagCent,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });

  await prisma.seasonRate.delete({ where: { id: parsed.data.id } }).catch(() => null);

  return NextResponse.json({ ok: true });
}
