import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { schreibeAudit } from "@/lib/finance";

const schema = z.object({
  datum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  betrag: z.number().positive().max(10_000_000),
  categoryId: z.string().min(1),
  notiz: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });

  const [j, m, t] = parsed.data.datum.split("-").map(Number);
  const betragCent = Math.round(parsed.data.betrag * 100);

  const expense = await prisma.expense.create({
    data: {
      datum: new Date(Date.UTC(j, m - 1, t)),
      betragCent,
      categoryId: parsed.data.categoryId,
      notiz: parsed.data.notiz,
      erfasstVon: guard.session.email,
    },
  });
  await schreibeAudit(guard.session.email, "ausgabe_erstellt", "Expense", expense.id, { betragCent });

  return NextResponse.json({ ok: true, id: expense.id });
}
