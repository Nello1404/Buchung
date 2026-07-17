import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { ProductCode } from "@/generated/prisma/client";

const createSchema = z.object({
  // "ALLE" = global (gilt für alle Produkte, productId = null)
  productCode: z.enum(["ALLE", "VALET", "SHUTTLE"]),
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().max(120).optional(),
});

const deleteSchema = z.object({ id: z.string().min(1) });

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

  let productId: string | null = null;
  if (parsed.data.productCode !== "ALLE") {
    const product = await prisma.product.findUnique({
      where: { code: parsed.data.productCode as ProductCode },
    });
    if (!product) return NextResponse.json({ error: "Produkt nicht gefunden." }, { status: 404 });
    productId = product.id;
  }

  const date = toDbDate(parsed.data.datum);

  // Duplikat vermeiden (die DB-Unique-Constraint greift bei productId = null nicht,
  // da NULL in Postgres als eindeutig gilt – daher manuell prüfen).
  const exists = await prisma.blockedDay.findFirst({ where: { productId, date } });
  if (exists) {
    return NextResponse.json({ error: "Dieser Sperrtag ist bereits hinterlegt." }, { status: 409 });
  }

  await prisma.blockedDay.create({
    data: { productId, date, reason: parsed.data.reason || null },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = deleteSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });

  await prisma.blockedDay.delete({ where: { id: parsed.data.id } }).catch(() => null);

  return NextResponse.json({ ok: true });
}
