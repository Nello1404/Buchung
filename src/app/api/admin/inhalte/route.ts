import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { CONTENT_SEITEN, istGueltigerSlug } from "@/lib/content-pages";

const schema = z.object({
  slug: z.string(),
  inhalt: z.string().max(50000),
});

export async function PATCH(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !istGueltigerSlug(parsed.data.slug)) {
    return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
  }
  const titel = CONTENT_SEITEN.find((s) => s.slug === parsed.data.slug)!.titel;

  await prisma.contentPage.upsert({
    where: { slug: parsed.data.slug },
    update: { inhalt: parsed.data.inhalt },
    create: { slug: parsed.data.slug, titel, inhalt: parsed.data.inhalt },
  });
  return NextResponse.json({ ok: true });
}
