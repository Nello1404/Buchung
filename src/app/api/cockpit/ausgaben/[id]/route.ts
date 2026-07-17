import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { schreibeAudit } from "@/lib/finance";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  await prisma.expense.delete({ where: { id } });
  await schreibeAudit(guard.session.email, "ausgabe_geloescht", "Expense", id, { betragCent: expense.betragCent });
  return NextResponse.json({ ok: true });
}
