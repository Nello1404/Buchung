import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { schreibeAudit } from "@/lib/finance";

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const parsed = z
    .object({ steuerRuecklageProzent: z.number().int().min(0).max(100) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });

  await prisma.settings.update({
    where: { id: "default" },
    data: { steuerRuecklageProzent: parsed.data.steuerRuecklageProzent },
  });
  await schreibeAudit(guard.session.email, "ruecklagensatz_geaendert", "Settings", "default", {
    prozent: parsed.data.steuerRuecklageProzent,
  });
  return NextResponse.json({ ok: true });
}
