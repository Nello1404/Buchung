import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getLiquiditaet, getMonatsuebersicht } from "@/lib/finance";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const sp = new URL(request.url).searchParams;
  const jetzt = new Date();
  const jahr = Number(sp.get("jahr")) || jetzt.getUTCFullYear();
  const monat = Number(sp.get("monat")) || jetzt.getUTCMonth() + 1;

  const [uebersicht, liquiditaet, ausgaben, kategorien, wiederkehrend, audit] = await Promise.all([
    getMonatsuebersicht(jahr, monat),
    getLiquiditaet(12),
    prisma.expense.findMany({
      where: {
        datum: { gte: new Date(Date.UTC(jahr, monat - 1, 1)), lt: new Date(Date.UTC(jahr, monat, 1)) },
      },
      include: { category: true },
      orderBy: { datum: "desc" },
    }),
    prisma.expenseCategory.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.recurringExpense.findMany({ where: { aktiv: true }, include: { category: true }, orderBy: { createdAt: "desc" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
  ]);

  return NextResponse.json({
    uebersicht,
    liquiditaet,
    ausgaben: ausgaben.map((a) => ({
      id: a.id,
      datum: a.datum.toISOString().slice(0, 10),
      betragCent: a.betragCent,
      kategorie: a.category.name,
      notiz: a.notiz,
      automatisch: a.recurringId !== null,
    })),
    kategorien: kategorien.map((k) => ({ id: k.id, name: k.name })),
    wiederkehrend: wiederkehrend.map((w) => ({
      id: w.id,
      name: w.name,
      betragCent: w.betragCent,
      kategorie: w.category.name,
      startDatum: w.startDatum.toISOString().slice(0, 10),
    })),
    audit: audit.map((a) => ({ email: a.email, aktion: a.aktion, entity: a.entity, zeit: a.createdAt.toISOString() })),
  });
}
