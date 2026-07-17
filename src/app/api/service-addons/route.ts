import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Liefert die aktiven Zusatzservices inkl. Preis für die angefragte Fahrzeugklasse
 * (?vehicleClass=CODE). Ohne gültige Fahrzeugklasse werden die Services ohne Preis
 * zurückgegeben (das Widget zeigt dann erst nach Klassenwahl Preise an).
 */
export async function GET(request: Request) {
  const vehicleClassCode = new URL(request.url).searchParams.get("vehicleClass");

  const vehicleClass = vehicleClassCode
    ? await prisma.vehicleClass.findFirst({ where: { code: vehicleClassCode, active: true } })
    : null;

  const addons = await prisma.serviceAddon.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: {
      preise: vehicleClass ? { where: { vehicleClassId: vehicleClass.id } } : false,
    },
  });

  return NextResponse.json({
    addons: addons.map((a) => ({
      code: a.code,
      name: a.name,
      description: a.description,
      preisCent: vehicleClass ? a.preise[0]?.preisCent ?? null : null,
    })),
  });
}
