import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { loescheBild } from "@/lib/blob";

const patchSchema = z.object({
  alt: z.string().max(200).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });

  const bild = await prisma.siteImage.findUnique({ where: { id } });
  if (!bild) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  const aktualisiert = await prisma.siteImage.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ bild: aktualisiert });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const { id } = await params;
  const bild = await prisma.siteImage.findUnique({ where: { id } });
  if (!bild) return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });

  // Erst aus dem Blob-Store entfernen, dann den DB-Eintrag löschen.
  try {
    await loescheBild(bild.pathname);
  } catch (error) {
    console.error("Blob-Löschung fehlgeschlagen (fahre fort):", error);
  }
  await prisma.siteImage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
