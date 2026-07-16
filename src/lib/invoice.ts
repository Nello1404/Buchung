import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { centZuEUR } from "@/lib/format";
import { ustAusweis } from "@/lib/pricing";

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

  const { width, height } = seite.getSize();
  let y = height - 60;
  const linkerRand = 50;
  const rechterRand = width - 50;

  function zeile(text: string, opts: { bold?: boolean; groesse?: number; x?: number } = {}) {
    seite.drawText(text, {
      x: opts.x ?? linkerRand,
      y,
      size: opts.groesse ?? 11,
      font: opts.bold ? fontBold : font,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  zeile("FlySpot Valet", { bold: true, groesse: 18 });
  y -= 16;
  zeile("Flughafen Frankfurt · www.flyspot-valet.de", { groesse: 9 });
  y -= 40;

  zeile("Rechnung", { bold: true, groesse: 14 });
  y -= 20;
  zeile(`Rechnungsnummer: ${daten.bookingNumber}`);
  y -= 16;
  zeile(`Rechnungsdatum: ${formatDatum.format(daten.rechnungsdatum)}`);
  y -= 16;
  zeile(`Kunde: ${daten.kundeName} (${daten.kundeEmail})`);
  y -= 32;

  zeile("Position", { bold: true, x: linkerRand });
  seite.drawText("Betrag", {
    x: rechterRand - 80,
    y,
    size: 11,
    font: fontBold,
  });
  y -= 8;
  seite.drawLine({
    start: { x: linkerRand, y },
    end: { x: rechterRand, y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 20;

  for (const pos of daten.positionen) {
    zeile(pos.bezeichnung);
    seite.drawText(centZuEUR(pos.preisCent), { x: rechterRand - 80, y, size: 11, font });
    y -= 20;
  }

  y -= 10;
  seite.drawLine({
    start: { x: linkerRand, y },
    end: { x: rechterRand, y },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  y -= 24;

  const { nettoCent, ustCent, bruttoCent } = ustAusweis(daten.preisGesamtCent);

  zeile("Nettobetrag");
  seite.drawText(centZuEUR(nettoCent), { x: rechterRand - 80, y, size: 11, font });
  y -= 18;
  zeile("zzgl. 19 % USt.");
  seite.drawText(centZuEUR(ustCent), { x: rechterRand - 80, y, size: 11, font });
  y -= 18;
  zeile("Gesamtbetrag", { bold: true });
  seite.drawText(centZuEUR(bruttoCent), { x: rechterRand - 80, y, size: 11, font: fontBold });

  y -= 60;
  zeile("Diese Rechnung wurde automatisch erstellt und ist ohne Unterschrift gültig.", { groesse: 8 });

  return doc.save();
}
