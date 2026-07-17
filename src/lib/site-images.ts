import { prisma } from "@/lib/prisma";
import { BILD_KATEGORIEN, type KategorieInfo } from "@/lib/image-categories";

export * from "@/lib/image-categories";

/// Aktive Bilder gruppiert nach Kategorie (für die öffentliche Galerie).
export async function ladeGalerie(): Promise<
  { info: KategorieInfo; bilder: { id: string; url: string; alt: string }[] }[]
> {
  const bilder = await prisma.siteImage.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, url: true, alt: true, kategorie: true },
  });

  return BILD_KATEGORIEN.map((info) => ({
    info,
    bilder: bilder
      .filter((b) => b.kategorie === info.code)
      .map((b) => ({ id: b.id, url: b.url, alt: b.alt })),
  })).filter((g) => g.bilder.length > 0);
}
