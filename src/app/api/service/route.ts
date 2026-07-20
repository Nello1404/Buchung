import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Öffentlicher Service-Katalog für die Seite /service.
 * Liefert alle aktiven Leistungen inkl. Festpreisen je Fahrzeugklasse,
 * gruppiert nach Kategorie und nach sortOrder sortiert.
 */
export async function GET() {
  const [services, klassen] = await Promise.all([
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ kategorie: "asc" }, { sortOrder: "asc" }],
      include: {
        preise: { include: { vehicleClass: { select: { code: true } } } },
      },
    }),
    prisma.vehicleClass.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { code: true, name: true },
    }),
  ]);

  return NextResponse.json({
    vehicleClasses: klassen,
    services: services.map((s) => ({
      code: s.code,
      name: s.name,
      kategorie: s.kategorie,
      beschreibung: s.beschreibung,
      typ: s.typ,
      preise: Object.fromEntries(s.preise.map((p) => [p.vehicleClass.code, p.preisCent])),
    })),
  });
}
