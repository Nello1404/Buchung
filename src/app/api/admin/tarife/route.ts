import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const updateSchema = z.object({
  tariffRules: z.array(z.object({ id: z.string(), preisProTagCent: z.number().int().min(0).max(1_000_000) })),
  addonPrices: z.array(z.object({ id: z.string(), preisCent: z.number().int().min(0).max(1_000_000) })),
});

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const [products, vehicleClasses, tariffRules, addons] = await Promise.all([
    prisma.product.findMany({ orderBy: { code: "asc" } }),
    prisma.vehicleClass.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.tariffRule.findMany({ orderBy: [{ productId: "asc" }, { vehicleClassId: "asc" }, { minTage: "asc" }] }),
    prisma.serviceAddon.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { preise: true },
    }),
  ]);

  return NextResponse.json({ products, vehicleClasses, tariffRules, addons });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }

  await prisma.$transaction([
    ...parsed.data.tariffRules.map((t) =>
      prisma.tariffRule.update({ where: { id: t.id }, data: { preisProTagCent: t.preisProTagCent } })
    ),
    ...parsed.data.addonPrices.map((a) =>
      prisma.serviceAddonPrice.update({ where: { id: a.id }, data: { preisCent: a.preisCent } })
    ),
  ]);

  return NextResponse.json({ ok: true });
}
