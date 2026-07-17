import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { schreibeAudit } from "@/lib/finance";

const schema = z
  .object({
    typ: z.enum(["TAG_GRATIS", "PROZENT", "BETRAG"]),
    /** PROZENT: 1–100, BETRAG: Euro (>0), TAG_GRATIS: egal. */
    wert: z.number().min(0).max(100000).optional(),
    bezeichnung: z.string().trim().max(80).optional(),
    anzahl: z.number().int().min(1).max(500).default(1),
    /** Optional: an eine Kunden-E-Mail binden (v. a. Treueaktion). */
    email: z.string().trim().email().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.typ === "PROZENT" && (!d.wert || d.wert < 1 || d.wert > 100)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Prozentwert 1–100 angeben.", path: ["wert"] });
    }
    if (d.typ === "BETRAG" && (!d.wert || d.wert <= 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Betrag größer 0 angeben.", path: ["wert"] });
    }
  });

function generiereCode(): string {
  return `FS-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." }, { status: 400 });
  }
  const d = parsed.data;

  // Wert in Cent bei BETRAG, sonst Prozentsatz / 0
  const wert = d.typ === "BETRAG" ? Math.round((d.wert ?? 0) * 100) : d.typ === "PROZENT" ? Math.round(d.wert ?? 0) : 0;

  let customerId: string | null = null;
  if (d.email) {
    const customer = await prisma.customer.upsert({
      where: { email: d.email.toLowerCase() },
      update: {},
      create: { email: d.email.toLowerCase(), name: d.email.toLowerCase() },
    });
    customerId = customer.id;
  }

  const codes: string[] = [];
  for (let i = 0; i < d.anzahl; i++) {
    // eindeutigen Code sicherstellen
    let code = generiereCode();
    for (let v = 0; v < 5; v++) {
      const exists = await prisma.voucher.findUnique({ where: { code } });
      if (!exists) break;
      code = generiereCode();
    }
    await prisma.voucher.create({
      data: { code, typ: d.typ, wert, bezeichnung: d.bezeichnung, customerId },
    });
    codes.push(code);
  }

  await schreibeAudit(guard.session.email, "gutscheine_erstellt", "Voucher", undefined, {
    typ: d.typ,
    wert,
    anzahl: d.anzahl,
  });
  return NextResponse.json({ ok: true, codes });
}
