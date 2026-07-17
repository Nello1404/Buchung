import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { schreibeAudit } from "@/lib/finance";

// Deaktiviert eine wiederkehrende Ausgabe (künftige Monate werden nicht mehr angelegt;
// bereits erzeugte Buchungen bleiben erhalten).
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const r = await prisma.recurringExpense.findUnique({ where: { id } });
  if (!r) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  await prisma.recurringExpense.update({ where: { id }, data: { aktiv: false } });
  await schreibeAudit(guard.session.email, "wiederkehrend_beendet", "RecurringExpense", id, { name: r.name });
  return NextResponse.json({ ok: true });
}
