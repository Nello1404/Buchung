import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { ProductCode } from "@/generated/prisma/client";

const schema = z.object({
  productCode: z.enum(["VALET", "SHUTTLE"]),
  vonDatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bisDatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kontingent: z.number().int().min(0).max(100000),
});

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { code: parsed.data.productCode as ProductCode } });
  if (!product) return NextResponse.json({ error: "Produkt nicht gefunden." }, { status: 404 });

  const [jv, mv, tv] = parsed.data.vonDatum.split("-").map(Number);
  const [jb, mb, tb] = parsed.data.bisDatum.split("-").map(Number);
  const von = new Date(Date.UTC(jv, mv - 1, tv));
  const bis = new Date(Date.UTC(jb, mb - 1, tb));
  if (bis.getTime() < von.getTime()) {
    return NextResponse.json({ error: "Bis-Datum liegt vor Von-Datum." }, { status: 400 });
  }
  const maxTage = 366;
  const tage = Math.round((bis.getTime() - von.getTime()) / 86400000) + 1;
  if (tage > maxTage) return NextResponse.json({ error: "Zeitraum zu groß (max. 1 Jahr)." }, { status: 400 });

  const ops = [];
  for (let i = 0; i < tage; i++) {
    const date = new Date(von);
    date.setUTCDate(date.getUTCDate() + i);
    ops.push(
      prisma.capacityDay.upsert({
        where: { productId_date: { productId: product.id, date } },
        update: { kontingent: parsed.data.kontingent },
        create: { productId: product.id, date, kontingent: parsed.data.kontingent },
      })
    );
  }
  await prisma.$transaction(ops);

  return NextResponse.json({ ok: true, tage });
}
