import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const preisSchema = z.object({
  vehicleClassId: z.string(),
  preisCent: z.number().int().min(0).max(1_000_000),
});

const serviceSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1).max(80),
  name: z.string().min(1).max(160),
  kategorie: z.string().min(1).max(80),
  beschreibung: z.string().max(2000).nullish(),
  typ: z.enum(["FESTPREIS", "ANFRAGE"]),
  sortOrder: z.number().int().min(0).max(9999),
  active: z.boolean(),
  preise: z.array(preisSchema).default([]),
});

export async function GET() {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const [services, vehicleClasses] = await Promise.all([
    prisma.service.findMany({
      orderBy: [{ kategorie: "asc" }, { sortOrder: "asc" }],
      include: { preise: true },
    }),
    prisma.vehicleClass.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return NextResponse.json({ services, vehicleClasses });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = serviceSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }
  const d = parsed.data;

  // Code-Kollision prüfen (bei neuem Service oder geändertem Code).
  const codeInUse = await prisma.service.findFirst({
    where: { code: d.code, ...(d.id ? { NOT: { id: d.id } } : {}) },
    select: { id: true },
  });
  if (codeInUse) {
    return NextResponse.json({ error: `Kürzel „${d.code}“ ist bereits vergeben.` }, { status: 400 });
  }

  // Nur bei FESTPREIS Preise speichern; ANFRAGE-Leistungen haben keine Festpreise.
  const preise = d.typ === "FESTPREIS" ? d.preise : [];

  const service = await prisma.$transaction(async (tx) => {
    const saved = d.id
      ? await tx.service.update({
          where: { id: d.id },
          data: {
            code: d.code,
            name: d.name,
            kategorie: d.kategorie,
            beschreibung: d.beschreibung ?? null,
            typ: d.typ,
            sortOrder: d.sortOrder,
            active: d.active,
          },
        })
      : await tx.service.create({
          data: {
            code: d.code,
            name: d.name,
            kategorie: d.kategorie,
            beschreibung: d.beschreibung ?? null,
            typ: d.typ,
            sortOrder: d.sortOrder,
            active: d.active,
          },
        });

    // Preise komplett neu setzen (einfach & robust bei wenigen Fahrzeugklassen).
    await tx.servicePreis.deleteMany({ where: { serviceId: saved.id } });
    if (preise.length) {
      await tx.servicePreis.createMany({
        data: preise.map((p) => ({
          serviceId: saved.id,
          vehicleClassId: p.vehicleClassId,
          preisCent: p.preisCent,
        })),
      });
    }
    return saved;
  });

  // Öffentliche Katalogseite sofort neu berechnen, damit Änderungen direkt erscheinen.
  revalidatePath("/service");

  return NextResponse.json({ ok: true, id: service.id });
}
