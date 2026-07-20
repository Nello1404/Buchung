import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

/** Service löschen. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  await prisma.service.delete({ where: { id } }).catch(() => null);
  revalidatePath("/service");
  return NextResponse.json({ ok: true });
}
