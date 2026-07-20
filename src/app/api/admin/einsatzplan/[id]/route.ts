import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

/** Eine geplante Schicht löschen. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  await prisma.schicht.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
