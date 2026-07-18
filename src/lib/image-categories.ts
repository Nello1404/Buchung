// Reine, client-sichere Bild-Kategorien (kein Prisma-Import!) – wird sowohl von
// Client-Komponenten als auch serverseitig genutzt.
import type { ImageCategory } from "@/generated/prisma/client";

export interface KategorieInfo {
  code: ImageCategory;
  label: string;
  beschreibung: string;
}

/// Reihenfolge bestimmt zugleich die Anzeige-Reihenfolge auf der Startseite.
export const BILD_KATEGORIEN: KategorieInfo[] = [
  { code: "STELLPLATZ", label: "Stellplatz & Gelände", beschreibung: "Gesichertes Gelände, Stellplätze, Ein-/Ausfahrt." },
  { code: "FLOTTE", label: "Flotte & Shuttle", beschreibung: "Shuttle-Fahrzeuge und Fuhrpark." },
  { code: "TEAM", label: "Unser Team", beschreibung: "Die Menschen hinter FlySpot Valet." },
  { code: "AUFBEREITUNG", label: "Aufbereitung", beschreibung: "Wäsche, Innenreinigung, Politur." },
];

export function kategorieLabel(code: ImageCategory): string {
  return BILD_KATEGORIEN.find((k) => k.code === code)?.label ?? code;
}

export function istKategorie(wert: string): wert is ImageCategory {
  return BILD_KATEGORIEN.some((k) => k.code === wert);
}
