import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { schreibeAudit } from "@/lib/finance";

const schema = z.object({
  warnAuslastungProzent: z.number().int().min(0).max(100),
  warnTagVollProzent: z.number().int().min(0).max(100),
  warnStornoquoteProzent: z.number().int().min(0).max(100),
});

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });

  await prisma.settings.update({ where: { id: "default" }, data: parsed.data });
  await schreibeAudit(guard.session.email, "warnschwellen_geaendert", "Settings", "default", parsed.data);
  return NextResponse.json({ ok: true });
}
