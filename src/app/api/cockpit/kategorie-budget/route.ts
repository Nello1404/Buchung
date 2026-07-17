import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { schreibeAudit } from "@/lib/finance";

const schema = z.object({
  categoryId: z.string().min(1),
  budget: z.number().min(0).max(10_000_000).nullable(),
});

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });

  await prisma.expenseCategory.update({
    where: { id: parsed.data.categoryId },
    data: { monatsBudgetCent: parsed.data.budget === null ? null : Math.round(parsed.data.budget * 100) },
  });
  await schreibeAudit(guard.session.email, "kategorie_budget_geaendert", "ExpenseCategory", parsed.data.categoryId, {
    budget: parsed.data.budget,
  });
  return NextResponse.json({ ok: true });
}
