import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { materialisiereWiederkehrende, schreibeAudit } from "@/lib/finance";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  betrag: z.number().positive().max(10_000_000),
  categoryId: z.string().min(1),
  startDatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });

  const [j, m, t] = parsed.data.startDatum.split("-").map(Number);
  const r = await prisma.recurringExpense.create({
    data: {
      name: parsed.data.name,
      betragCent: Math.round(parsed.data.betrag * 100),
      categoryId: parsed.data.categoryId,
      startDatum: new Date(Date.UTC(j, m - 1, t)),
    },
  });
  await schreibeAudit(guard.session.email, "wiederkehrend_erstellt", "RecurringExpense", r.id, { name: r.name });
  await materialisiereWiederkehrende();
  return NextResponse.json({ ok: true, id: r.id });
}
