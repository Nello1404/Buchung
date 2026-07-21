import { rgb, type PDFFont, type PDFPage } from "pdf-lib";

// Markenfarben für PDFs (Gold-Akzente auf Weiß – elegant und druckfreundlich).
export const PDF_GOLD = rgb(0.611, 0.486, 0.219);
export const PDF_GOLD_LIGHT = rgb(0.784, 0.643, 0.361);
export const PDF_INK = rgb(0.102, 0.114, 0.137);
export const PDF_MUTED = rgb(0.42, 0.42, 0.42);
export const PDF_LINE = rgb(0.85, 0.85, 0.85);
export const PDF_GOLD_BG = rgb(0.973, 0.945, 0.878);

export interface PdfFonts {
  font: PDFFont;
  fontBold: PDFFont;
}

/**
 * Zeichnet den einheitlichen Markenkopf (Wortmarke links, Dokumenttitel rechts,
 * Gold-Trennlinie darunter). Gibt die neue y-Position (unter dem Kopf) zurück.
 */
export function zeichneMarkenkopf(
  seite: PDFPage,
  fonts: PdfFonts,
  opts: { links: number; rechts: number; titel: string; subtitel?: string }
): number {
  const { links, rechts, titel, subtitel } = opts;
  const { height } = seite.getSize();
  let y = height - 58;

  // Wortmarke: "FlySpot" (gold) + " Valet" (grau)
  const markeA = "FlySpot";
  const markeB = " Valet";
  seite.drawText(markeA, { x: links, y, size: 20, font: fonts.fontBold, color: PDF_GOLD });
  const wA = fonts.fontBold.widthOfTextAtSize(markeA, 20);
  seite.drawText(markeB, { x: links + wA, y, size: 20, font: fonts.fontBold, color: rgb(0.5, 0.52, 0.56) });

  // Dokumenttitel rechtsbündig auf gleicher Höhe
  const tSize = 15;
  const tW = fonts.fontBold.widthOfTextAtSize(titel, tSize);
  seite.drawText(titel, { x: rechts - tW, y: y + 2, size: tSize, font: fonts.fontBold, color: PDF_INK });

  y -= 15;
  seite.drawText("Flughafen Frankfurt · www.flyspot-valet.de", { x: links, y, size: 9, font: fonts.font, color: PDF_MUTED });
  if (subtitel) {
    const sW = fonts.font.widthOfTextAtSize(subtitel, 9);
    seite.drawText(subtitel, { x: rechts - sW, y, size: 9, font: fonts.font, color: PDF_MUTED });
  }

  // Gold-Trennlinie
  y -= 16;
  seite.drawRectangle({ x: links, y, width: rechts - links, height: 2, color: PDF_GOLD });
  return y - 26;
}

/** Zeichnet eine dezente Fußzeile mit Gold-Linie und Kleingedrucktem. */
export function zeichneMarkenfuss(seite: PDFPage, font: PDFFont, opts: { links: number; rechts: number; zeilen: string[] }) {
  const { links, rechts, zeilen } = opts;
  let y = 66;
  seite.drawRectangle({ x: links, y: y + 12, width: rechts - links, height: 1, color: PDF_LINE });
  for (const z of zeilen) {
    seite.drawText(z, { x: links, y, size: 8, font, color: PDF_MUTED });
    y -= 11;
  }
}
