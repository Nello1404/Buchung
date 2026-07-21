import { PDFDocument, StandardFonts } from "pdf-lib";
import { centZuEUR } from "@/lib/format";
import { ustAusweis } from "@/lib/pricing";
import {
  zeichneMarkenkopf,
  zeichneMarkenfuss,
  PDF_GOLD,
  PDF_INK,
  PDF_MUTED,
  PDF_LINE,
  PDF_GOLD_BG,
} from "@/lib/pdf-brand";

export interface RechnungsPosition {
  bezeichnung: string;
  preisCent: number;
}

export interface RechnungsDaten {
  bookingNumber: string;
  rechnungsdatum: Date;
  kundeName: string;
  kundeEmail: string;
  positionen: RechnungsPosition[];
  preisGesamtCent: number;
}

const formatDatum = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", dateStyle: "long" });

export async function erzeugeRechnungsPdf(daten: RechnungsDaten): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const seite = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const { width } = seite.getSize();
  const links = 50;
  const rechts = width - 50;
  const betragX = rechts - 90;

  let y = zeichneMarkenkopf(seite, { font, fontBold }, {
    links,
    rechts,
    titel: "Rechnung",
    subtitel: `Nr. ${daten.bookingNumber}`,
  });

  // Meta + Empfänger nebeneinander
  const metaY = y;
  seite.drawText("Rechnungsdatum", { x: links, y: metaY, size: 9, font, color: PDF_MUTED });
  seite.drawText(formatDatum.format(daten.rechnungsdatum), { x: links, y: metaY - 14, size: 11, font, color: PDF_INK });
  seite.drawText("Rechnungsnummer", { x: links, y: metaY - 34, size: 9, font, color: PDF_MUTED });
  seite.drawText(daten.bookingNumber, { x: links, y: metaY - 48, size: 11, font: fontBold, color: PDF_INK });

  const empfX = links + 270;
  seite.drawText("Rechnungsempfänger", { x: empfX, y: metaY, size: 9, font, color: PDF_MUTED });
  seite.drawText(daten.kundeName, { x: empfX, y: metaY - 14, size: 11, font: fontBold, color: PDF_INK });
  seite.drawText(daten.kundeEmail, { x: empfX, y: metaY - 30, size: 10, font, color: PDF_MUTED });

  y = metaY - 78;

  // Positionstabelle – Kopf
  seite.drawText("POSITION", { x: links, y, size: 9, font: fontBold, color: PDF_MUTED });
  const betragKopf = "BETRAG";
  seite.drawText(betragKopf, { x: rechts - fontBold.widthOfTextAtSize(betragKopf, 9), y, size: 9, font: fontBold, color: PDF_MUTED });
  y -= 10;
  seite.drawRectangle({ x: links, y, width: rechts - links, height: 1, color: PDF_LINE });
  y -= 20;

  for (const pos of daten.positionen) {
    seite.drawText(pos.bezeichnung, { x: links, y, size: 11, font, color: PDF_INK });
    const b = centZuEUR(pos.preisCent);
    seite.drawText(b, { x: rechts - font.widthOfTextAtSize(b, 11), y, size: 11, font, color: PDF_INK });
    y -= 20;
  }

  y -= 4;
  seite.drawRectangle({ x: links, y, width: rechts - links, height: 0.6, color: PDF_LINE });
  y -= 22;

  const { nettoCent, ustCent, bruttoCent } = ustAusweis(daten.preisGesamtCent);

  function summenzeile(label: string, betrag: string, opts: { bold?: boolean } = {}) {
    const f = opts.bold ? fontBold : font;
    const size = opts.bold ? 12 : 11;
    seite.drawText(label, { x: betragX - 130, y, size, font: f, color: opts.bold ? PDF_INK : PDF_MUTED });
    seite.drawText(betrag, { x: rechts - f.widthOfTextAtSize(betrag, size), y, size, font: f, color: PDF_INK });
    y -= opts.bold ? 22 : 18;
  }

  summenzeile("Nettobetrag", centZuEUR(nettoCent));
  summenzeile("zzgl. 19 % USt.", centZuEUR(ustCent));

  // Gesamtbetrag – hervorgehobene Gold-Box
  y -= 2;
  const boxH = 34;
  seite.drawRectangle({ x: betragX - 150, y: y - boxH + 22, width: rechts - (betragX - 150), height: boxH, color: PDF_GOLD_BG });
  seite.drawText("Gesamtbetrag", { x: betragX - 138, y: y + 2, size: 12, font: fontBold, color: PDF_INK });
  const gesamt = centZuEUR(bruttoCent);
  seite.drawText(gesamt, { x: rechts - 12 - fontBold.widthOfTextAtSize(gesamt, 13), y: y + 1, size: 13, font: fontBold, color: PDF_GOLD });

  zeichneMarkenfuss(seite, font, {
    links,
    rechts,
    zeilen: [
      "FlySpot Valet · Flughafen Frankfurt · www.flyspot-valet.de",
      "Diese Rechnung wurde automatisch erstellt und ist ohne Unterschrift gültig.",
    ],
  });

  return doc.save();
}
