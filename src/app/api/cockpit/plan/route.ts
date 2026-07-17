import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { getPlanIst } from "@/lib/plan";
import { schreibeAudit } from "@/lib/finance";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  const sp = new URL(request.url).searchParams;
  const jetzt = new Date();
  const jahr = Number(sp.get("jahr")) || jetzt.getUTCFullYear();
  const monat = Number(sp.get("monat")) || jetzt.getUTCMonth() + 1;
  return NextResponse.json(await getPlanIst(jahr, monat));
}

const schema = z.object({
  jahr: z.number().int().min(2020).max(2100),
  monat: z.number().int().min(1).max(12),
  auslastungValetProzent: z.number().int().min(0).max(100),
  auslastungShuttleProzent: z.number().int().min(0).max(100),
  umsatz: z.number().min(0).max(100_000_000),
  kosten: z.number().min(0).max(100_000_000),
});

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });

  const d = parsed.data;
  await prisma.planMonth.upsert({
    where: { jahr_monat: { jahr: d.jahr, monat: d.monat } },
    update: {
      auslastungValetProzent: d.auslastungValetProzent,
      auslastungShuttleProzent: d.auslastungShuttleProzent,
      umsatzCent: Math.round(d.umsatz * 100),
      kostenCent: Math.round(d.kosten * 100),
    },
    create: {
      jahr: d.jahr,
      monat: d.monat,
      auslastungValetProzent: d.auslastungValetProzent,
      auslastungShuttleProzent: d.auslastungShuttleProzent,
      umsatzCent: Math.round(d.umsatz * 100),
      kostenCent: Math.round(d.kosten * 100),
    },
  });
  await schreibeAudit(guard.session.email, "planwerte_gespeichert", "PlanMonth", `${d.jahr}-${d.monat}`, { umsatz: d.umsatz, kosten: d.kosten });
  return NextResponse.json({ ok: true });
}
