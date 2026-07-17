import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const classes = await prisma.vehicleClass.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { code: true, name: true },
  });
  return NextResponse.json({ vehicleClasses: classes });
}
