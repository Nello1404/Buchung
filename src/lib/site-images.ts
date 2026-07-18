import { prisma } from "@/lib/prisma";
import { BILD_KATEGORIEN, type KategorieInfo } from "@/lib/image-categories";

export * from "@/lib/image-categories";

export interface GalerieGruppe {
  info: KategorieInfo;
  bilder: { id: string; url: string; alt: string }[];
}

/// Aktive Bilder gruppiert nach Kategorie (nur nicht-leere Gruppen).
export async function ladeGalerie(): Promise<GalerieGruppe[]> {
  return (await ladeGalerieVoll()).filter((g) => g.bilder.length > 0);
}

/// Alle vier Kategorien inkl. leerer – für die feste 4-Kachel-Galerie mit
/// „Bild folgt"-Platzhaltern.
export async function ladeGalerieVoll(): Promise<GalerieGruppe[]> {
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
  }));
}
