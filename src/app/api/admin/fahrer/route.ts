import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Bitte einen Namen angeben.").max(120),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});

export async function GET() {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const fahrer = await prisma.fahrer.findMany({
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ fahrer });
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." }, { status: 400 });
  }
  const d = parsed.data;

  const saved = d.id
    ? await prisma.fahrer.update({
        where: { id: d.id },
        data: { name: d.name, active: d.active, sortOrder: d.sortOrder },
      })
    : await prisma.fahrer.create({
        data: { name: d.name, active: d.active, sortOrder: d.sortOrder },
      });

  return NextResponse.json({ ok: true, id: saved.id });
}
