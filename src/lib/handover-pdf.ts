import { PDFDocument, StandardFonts, rgb, type PDFImage } from "pdf-lib";
import { phaseLabel } from "@/lib/handover";
import { zeichneMarkenkopf, zeichneMarkenfuss, PDF_GOLD, PDF_INK, PDF_MUTED, PDF_LINE } from "@/lib/pdf-brand";

export interface ProtokollPdfDaten {
  bookingNumber: string;
  phase: string;
  erstelltAm: Date;
  erstelltVon: string;
  fahrer: string;
  kmStand: number | null;
  tankstand: string | null;
  bemerkung: string | null;
  kunde: { name: string; email: string; telefon: string | null };
  fahrzeug: {
    kennzeichen: string;
    klasse: string | null;
    marke: string | null;
    farbe: string | null;
    auffaelligkeiten: string | null;
  };
  produktName: string;
  anreise: Date;
  abreise: Date;
  flugnummer: string | null;
  fotoUrls: string[];
  unterschriftUrl: string | null;
}

const fmtDatumZeit = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  dateStyle: "medium",
  timeStyle: "short",
});

async function ladeBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

// Bettet JPEG/PNG ein (per Magic-Bytes erkannt). WebP/AVIF werden übersprungen,
// da pdf-lib sie nicht unterstützt.
async function bildEinbetten(doc: PDFDocument, bytes: Uint8Array): Promise<PDFImage | null> {
  try {
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return await doc.embedJpg(bytes);
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
      return await doc.embedPng(bytes);
    return null;
  } catch {
    return null;
  }
}

export async function erzeugeProtokollPdf(d: ProtokollPdfDaten): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const A4: [number, number] = [595.28, 841.89];
  const links = 50;

  let seite = doc.addPage(A4);
  let { width, height } = seite.getSize();
  const rechts = width - 50;

  let y = zeichneMarkenkopf(seite, { font, fontBold }, {
    links,
    rechts,
    titel: "Übergabeprotokoll",
    subtitel: phaseLabel(d.phase),
  });
  seite.drawText(`Buchung ${d.bookingNumber} · erstellt ${fmtDatumZeit.format(d.erstelltAm)} Uhr`, {
    x: links,
    y,
    size: 9,
    font,
    color: PDF_MUTED,
  });
  y -= 24;

  function neueSeiteWennNoetig(brauche: number) {
    if (y - brauche < 90) {
      seite = doc.addPage(A4);
      ({ width, height } = seite.getSize());
      y = height - 55;
    }
  }

  function text(t: string, o: { bold?: boolean; size?: number; x?: number; color?: ReturnType<typeof rgb> } = {}) {
    seite.drawText(t, {
      x: o.x ?? links,
      y,
      size: o.size ?? 11,
      font: o.bold ? fontBold : font,
      color: o.color ?? PDF_INK,
    });
  }

  function abschnitt(titel: string) {
    neueSeiteWennNoetig(40);
    text(titel, { bold: true, size: 12, color: PDF_GOLD });
    y -= 6;
    seite.drawRectangle({ x: links, y, width: rechts - links, height: 0.8, color: PDF_LINE });
    y -= 18;
  }

  function feld(label: string, wert: string) {
    neueSeiteWennNoetig(18);
    text(label, { x: links, size: 10, color: PDF_MUTED });
    seite.drawText(wert || "–", { x: links + 150, y, size: 10, font, color: PDF_INK });
    y -= 17;
  }

  abschnitt("Kunde");
  feld("Name", d.kunde.name);
  feld("E-Mail", d.kunde.email);
  feld("Telefon", d.kunde.telefon ?? "–");

  y -= 8;
  abschnitt("Fahrzeug");
  feld("Kennzeichen", d.fahrzeug.kennzeichen);
  feld("Fahrzeugklasse", d.fahrzeug.klasse ?? "–");
  feld("Marke / Farbe", [d.fahrzeug.marke, d.fahrzeug.farbe].filter(Boolean).join(" / ") || "–");
  if (d.fahrzeug.auffaelligkeiten) feld("Auffälligkeiten", d.fahrzeug.auffaelligkeiten);

  y -= 8;
  abschnitt("Buchung");
  feld("Produkt", d.produktName);
  feld("Anreise", `${fmtDatumZeit.format(d.anreise)} Uhr`);
  feld("Abreise", `${fmtDatumZeit.format(d.abreise)} Uhr`);
  feld("Flugnummer (Rückflug)", d.flugnummer ?? "–");

  y -= 8;
  abschnitt("Übergabe");
  feld("Zeitpunkt", phaseLabel(d.phase));
  feld("Fahrer", d.fahrer);
  feld("Kilometerstand", d.kmStand != null ? `${d.kmStand.toLocaleString("de-DE")} km` : "–");
  feld("Tank-/Ladestand", d.tankstand ?? "–");
  feld("Erfasst von", d.erstelltVon);
  if (d.bemerkung) {
    neueSeiteWennNoetig(30);
    text("Bemerkungen", { x: links, size: 10, color: rgb(0.45, 0.45, 0.45) });
    y -= 15;
    // Einfacher Zeilenumbruch für längere Bemerkungen
    for (const zeile of umbrechen(d.bemerkung, 95)) {
      neueSeiteWennNoetig(14);
      text(zeile, { size: 10 });
      y -= 14;
    }
  }

  // Unterschrift
  if (d.unterschriftUrl) {
    const bytes = await ladeBytes(d.unterschriftUrl);
    const img = bytes ? await bildEinbetten(doc, bytes) : null;
    if (img) {
      y -= 14;
      abschnitt("Unterschrift Kunde");
      neueSeiteWennNoetig(90);
      const bildBreite = 200;
      const bildHoehe = (img.height / img.width) * bildBreite;
      seite.drawRectangle({
        x: links,
        y: y - bildHoehe,
        width: bildBreite,
        height: bildHoehe,
        color: rgb(1, 1, 1),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 0.5,
      });
      seite.drawImage(img, { x: links, y: y - bildHoehe, width: bildBreite, height: bildHoehe });
      y -= bildHoehe + 20;
    }
  }

  // Fotos
  if (d.fotoUrls.length > 0) {
    y -= 6;
    abschnitt("Fotos");
    for (const url of d.fotoUrls) {
      const bytes = await ladeBytes(url);
      const img = bytes ? await bildEinbetten(doc, bytes) : null;
      if (!img) continue;
      const maxBreite = rechts - links;
      const maxHoehe = 300;
      let bBreite = maxBreite;
      let bHoehe = (img.height / img.width) * bBreite;
      if (bHoehe > maxHoehe) {
        bHoehe = maxHoehe;
        bBreite = (img.width / img.height) * bHoehe;
      }
      neueSeiteWennNoetig(bHoehe + 16);
      seite.drawImage(img, { x: links, y: y - bHoehe, width: bBreite, height: bHoehe });
      y -= bHoehe + 16;
    }
  }

  zeichneMarkenfuss(seite, font, {
    links,
    rechts,
    zeilen: [
      "FlySpot Valet · Flughafen Frankfurt · www.flyspot-valet.de",
      "Dieses Protokoll dokumentiert den Fahrzeugzustand zum genannten Zeitpunkt.",
    ],
  });

  return doc.save();
}

function umbrechen(text: string, maxLen: number): string[] {
  const woerter = text.split(/\s+/);
  const zeilen: string[] = [];
  let aktuell = "";
  for (const w of woerter) {
    if ((aktuell + " " + w).trim().length > maxLen) {
      if (aktuell) zeilen.push(aktuell);
      aktuell = w;
    } else {
      aktuell = (aktuell + " " + w).trim();
    }
  }
  if (aktuell) zeilen.push(aktuell);
  return zeilen;
}
