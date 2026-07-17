import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { schreibeAudit } from "@/lib/finance";

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const parsed = z.object({ name: z.string().trim().min(2).max(60) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });

  const existing = await prisma.expenseCategory.findUnique({ where: { name: parsed.data.name } });
  if (existing) return NextResponse.json({ error: "Kategorie existiert bereits." }, { status: 409 });

  const anzahl = await prisma.expenseCategory.count();
  const kat = await prisma.expenseCategory.create({ data: { name: parsed.data.name, sortOrder: anzahl + 1 } });
  await schreibeAudit(guard.session.email, "kategorie_erstellt", "ExpenseCategory", kat.id, { name: kat.name });
  return NextResponse.json({ ok: true, id: kat.id });
}
