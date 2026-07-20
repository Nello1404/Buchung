import { prisma } from "@/lib/prisma";

/**
 * Günstigster Tagespreis je Produkt („ab X €/Tag") – live aus den gepflegten
 * Tarifen. So steht auf der Startseite eine echte Zahl statt nur „Preis im
 * Assistenten". Gibt Cent-Beträge zurück (oder undefined, falls kein Tarif).
 */
export async function abPreiseProProdukt(): Promise<{ VALET?: number; SHUTTLE?: number }> {
  const rows = await prisma.tariffRule.findMany({
    select: { preisProTagCent: true, product: { select: { code: true } } },
  });
  const result: { VALET?: number; SHUTTLE?: number } = {};
  for (const r of rows) {
    const code = r.product.code as "VALET" | "SHUTTLE";
    if (result[code] === undefined || r.preisProTagCent < result[code]!) {
      result[code] = r.preisProTagCent;
    }
  }
  return result;
}

/**
 * Optionales Hero-Hintergrundbild: das erste aktive Website-Bild (bevorzugt
 * Stellplatz/Flotte). Ist keins gepflegt, gibt es null – dann greift der
 * dezente Gold-Verlauf als Fallback.
 */
export async function heroBild(): Promise<string | null> {
  const bilder = await prisma.siteImage.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { url: true, kategorie: true },
  });
  if (bilder.length === 0) return null;
  const bevorzugt = ["STELLPLATZ", "FLOTTE", "AUFBEREITUNG", "TEAM"];
  for (const kat of bevorzugt) {
    const treffer = bilder.find((b) => b.kategorie === kat);
    if (treffer) return treffer.url;
  }
  return bilder[0].url;
}
