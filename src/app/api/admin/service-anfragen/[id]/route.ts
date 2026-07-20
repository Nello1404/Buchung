import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

const patchSchema = z.object({
  status: z.enum(["NEU", "IN_BEARBEITUNG", "ERLEDIGT", "ABGELEHNT"]),
});

/** Status einer Service-Anfrage ändern. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
  }

  await prisma.serviceAnfrage.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.json({ ok: true });
}
