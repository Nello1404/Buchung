import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const datumRegex = /^\d{4}-\d{2}-\d{2}$/;
const zeitRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

function tagUtc(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const url = new URL(request.url);
  const von = url.searchParams.get("von");
  const bis = url.searchParams.get("bis");
  if (!von || !bis || !datumRegex.test(von) || !datumRegex.test(bis)) {
    return NextResponse.json({ error: "Zeitraum (von/bis) fehlt oder ist ungültig." }, { status: 400 });
  }

  const [mitarbeiter, schichten] = await Promise.all([
    prisma.mitarbeiter.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, rolle: true, email: true, feedToken: true },
    }),
    prisma.schicht.findMany({
      where: { datum: { gte: tagUtc(von), lte: tagUtc(bis) } },
      orderBy: [{ datum: "asc" }, { vonZeit: "asc" }],
    }),
  ]);

  return NextResponse.json({
    mitarbeiter,
    schichten: schichten.map((s) => ({
      id: s.id,
      mitarbeiterId: s.mitarbeiterId,
      datum: s.datum.toISOString().slice(0, 10),
      vonZeit: s.vonZeit,
      bisZeit: s.bisZeit,
      notiz: s.notiz,
    })),
  });
}

const schichtSchema = z.object({
  id: z.string().optional(),
  mitarbeiterId: z.string().min(1),
  datum: z.string().regex(datumRegex),
  vonZeit: z.string().regex(zeitRegex),
  bisZeit: z.string().regex(zeitRegex),
  notiz: z.string().trim().max(200).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = schichtSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }
  const d = parsed.data;
  if (d.bisZeit <= d.vonZeit) {
    return NextResponse.json({ error: "Das Ende muss nach dem Beginn liegen." }, { status: 400 });
  }

  const data = {
    mitarbeiterId: d.mitarbeiterId,
    datum: tagUtc(d.datum),
    vonZeit: d.vonZeit,
    bisZeit: d.bisZeit,
    notiz: d.notiz ? d.notiz : null,
  };

  const saved = d.id
    ? await prisma.schicht.update({ where: { id: d.id }, data })
    : await prisma.schicht.create({ data });

  return NextResponse.json({ ok: true, id: saved.id });
}
