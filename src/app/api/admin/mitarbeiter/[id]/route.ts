import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

/** Mitarbeiter löschen. Bereits erfasste Protokolle behalten den Namen (Snapshot). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  await prisma.mitarbeiter.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
