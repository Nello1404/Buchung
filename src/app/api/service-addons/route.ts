import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const addons = await prisma.serviceAddon.findMany({
    where: { active: true },
    orderBy: { preisCent: "asc" },
    select: { code: true, name: true, description: true, preisCent: true },
  });
  return NextResponse.json({ addons });
}
