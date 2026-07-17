import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const schema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(2).optional(),
});

function generiereCode(): string {
  const teil = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `FS-${teil}`;
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });

  const email = parsed.data.email.toLowerCase();
  const customer = await prisma.customer.upsert({
    where: { email },
    update: parsed.data.name ? { name: parsed.data.name } : {},
    create: { email, name: parsed.data.name ?? email },
  });

  // eindeutigen Code sicherstellen
  let code = generiereCode();
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.voucher.findUnique({ where: { code } });
    if (!exists) break;
    code = generiereCode();
  }

  const voucher = await prisma.voucher.create({
    data: { code, customerId: customer.id },
  });

  return NextResponse.json({ ok: true, code: voucher.code });
}
