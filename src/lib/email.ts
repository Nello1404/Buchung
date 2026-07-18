import { Resend } from "resend";

let client: Resend | undefined;

function getResend(): Resend | undefined {
  const key = process.env.RESEND_API_KEY;
  if (!key) return undefined;
  if (!client) client = new Resend(key);
  return client;
}

const EMAIL_FROM = process.env.EMAIL_FROM || "FlySpot Valet <buchung@flyspot-valet.de>";

interface Anhang {
  filename: string;
  content: Buffer;
}

async function sende(an: string, betreff: string, html: string, anhaenge?: Anhang[]) {
  const resend = getResend();
  if (!resend) {
    console.log(
      `[E-Mail nicht gesendet – RESEND_API_KEY fehlt] An: ${an} | Betreff: ${betreff}` +
        (anhaenge?.length ? ` | Anhänge: ${anhaenge.map((a) => a.filename).join(", ")}` : "") +
        `\n${html}`
    );
    return;
  }
  await resend.emails.send({
    from: EMAIL_FROM,
    to: an,
    subject: betreff,
    html,
    attachments: anhaenge?.map((a) => ({ filename: a.filename, content: a.content })),
  });
}

const formatEUR = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });
const formatDatum = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  dateStyle: "medium",
  timeStyle: "short",
});

function centToEUR(cent: number) {
  return formatEUR.format(cent / 100);
}

const formatDatumKurz = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  dateStyle: "medium",
});

function isoZuDatum(iso: string): Date {
  const [j, m, t] = iso.split("-").map(Number);
  return new Date(Date.UTC(j, m - 1, t, 12));
}

function baseLayout(inhalt: string) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
    <div style="border-bottom: 2px solid #c8a45c; padding-bottom: 10px; margin-bottom: 20px;">
      <span style="font-size: 22px; font-weight: 700; letter-spacing: 1px;">
        <span style="color: #9c7c38;">FLY</span><span style="color: #7a7f88;">SPOT</span>
      </span>
      <span style="font-size: 12px; letter-spacing: 4px; color: #9c7c38; margin-left: 6px;">VALET</span>
    </div>
    ${inhalt}
    <hr style="margin-top: 32px; border: none; border-top: 1px solid #ddd;" />
    <p style="font-size: 12px; color: #666;">
      FlySpot Valet · Flughafen Frankfurt · www.flyspot-valet.de<br />
      Diese E-Mail wurde automatisch generiert.
    </p>
  </div>`;
}

export async function sendeBuchungsbestaetigung(params: {
  an: string;
  bookingNumber: string;
  produktName: string;
  anreise: Date;
  abreise: Date;
  preisGesamtCent: number;
  flugnummer?: string | null;
}) {
  const { an, bookingNumber, produktName, anreise, abreise, preisGesamtCent, flugnummer } = params;
  const html = baseLayout(`
    <p>Vielen Dank für Ihre Buchung bei FlySpot Valet!</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding:4px 0;color:#666;">Buchungsnummer</td><td style="padding:4px 0;font-weight:bold;">${bookingNumber}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Produkt</td><td style="padding:4px 0;">${produktName}</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Anreise</td><td style="padding:4px 0;">${formatDatum.format(anreise)} Uhr</td></tr>
      <tr><td style="padding:4px 0;color:#666;">Abreise</td><td style="padding:4px 0;">${formatDatum.format(abreise)} Uhr</td></tr>
      ${flugnummer ? `<tr><td style="padding:4px 0;color:#666;">Flugnummer</td><td style="padding:4px 0;">${flugnummer}</td></tr>` : ""}
      <tr><td style="padding:4px 0;color:#666;">Gesamtpreis</td><td style="padding:4px 0;font-weight:bold;">${centToEUR(preisGesamtCent)}</td></tr>
    </table>
    <p><strong>So funktioniert's:</strong></p>
    <p>Bitte fahren Sie zur vereinbarten Zeit direkt zum Valet-/Shuttle-Terminal am Flughafen Frankfurt.
    Unser Team empfängt Sie dort mit Ihrer Buchungsnummer. Eine kostenlose Stornierung ist bis 48 Stunden
    vor Anreise möglich (danach 50 % Erstattung).</p>
  `);
  await sende(an, `Buchungsbestätigung ${bookingNumber} – FlySpot Valet`, html);
}

export async function sendeStornoBestaetigung(params: {
  an: string;
  bookingNumber: string;
  erstattungProzent: number;
  erstattetCent: number;
}) {
  const { an, bookingNumber, erstattungProzent, erstattetCent } = params;
  const html = baseLayout(`
    <p>Ihre Buchung <strong>${bookingNumber}</strong> wurde storniert.</p>
    <p>Erstattung: <strong>${erstattungProzent} %</strong> (${centToEUR(erstattetCent)}). Der Betrag wird
    in den nächsten Tagen auf Ihr ursprüngliches Zahlungsmittel zurückgebucht.</p>
  `);
  await sende(an, `Stornobestätigung ${bookingNumber} – FlySpot Valet`, html);
}

function zeile(label: string, wert: string, hervor = false) {
  return `<tr>
    <td style="padding:6px 0;color:#666;">${label}</td>
    <td style="padding:6px 0;text-align:right;${hervor ? "font-weight:bold;" : ""}">${wert}</td>
  </tr>`;
}

/** Wöchentlicher Report an die Geschäftsführung (Cockpit-Kennzahlen der Vorwoche). */
export async function sendeWochenreport(params: {
  an: string;
  vonISO: string;
  bisISO: string;
  bruttoCent: number;
  erstattetCent: number;
  nettoNachStornoCent: number;
  anzahlBuchungen: number;
  stornierteAnzahl: number;
  stornoquoteProzent: number;
  oErloesProFahrzeugTagCent: number;
  oBuchungsdauerTage: number;
  vorwocheBruttoCent: number;
  veraenderungProzent: number | null;
}) {
  const von = formatDatumKurz.format(isoZuDatum(params.vonISO));
  const bis = formatDatumKurz.format(isoZuDatum(params.bisISO));

  const trend =
    params.veraenderungProzent === null
      ? "—"
      : `${params.veraenderungProzent >= 0 ? "▲ +" : "▼ "}${params.veraenderungProzent} % ggü. Vorwoche`;

  const html = baseLayout(`
    <h2 style="font-size: 17px; margin: 0 0 4px;">Wochenreport ${von} – ${bis}</h2>
    <p style="color:#666; margin-top:0;">Auswertung nach Zahlungsdatum (Stichtag = Zahlungseingang).</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      ${zeile("Brutto-Umsatz", centToEUR(params.bruttoCent), true)}
      ${zeile("Veränderung", trend)}
      ${zeile("Erstattungen (Storno)", "− " + centToEUR(params.erstattetCent))}
      ${zeile("Netto nach Storno", centToEUR(params.nettoNachStornoCent), true)}
      <tr><td colspan="2" style="border-top:1px solid #eee;padding-top:6px;"></td></tr>
      ${zeile("Bezahlte Buchungen", String(params.anzahlBuchungen))}
      ${zeile("Davon storniert", `${params.stornierteAnzahl} (${params.stornoquoteProzent} %)`)}
      ${zeile("Ø Erlös / Fahrzeug-Tag", centToEUR(params.oErloesProFahrzeugTagCent))}
      ${zeile("Ø Buchungsdauer", `${params.oBuchungsdauerTage} Tage`)}
    </table>
    <p style="font-size:13px;color:#666;">
      Details und Diagramme in der Betriebszentrale unter „Umsatz“.
    </p>
  `);

  await sende(params.an, `Wochenreport ${von} – ${bis} · FlySpot Valet`, html);
}

/** Übergabeprotokoll als PDF an das Team senden. */
export async function sendeUebergabeprotokoll(params: {
  an: string;
  bookingNumber: string;
  phaseLabel: string;
  kennzeichen: string;
  kundeName: string;
  fahrer: string;
  kmStand: number | null;
  tankstand: string | null;
  erstelltAm: Date;
  pdf: Buffer;
}) {
  const html = baseLayout(`
    <h2 style="font-size: 17px; margin: 0 0 4px;">Übergabeprotokoll – ${params.phaseLabel}</h2>
    <p style="color:#666; margin-top:0;">Erfasst am ${formatDatum.format(params.erstelltAm)} Uhr.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      ${zeile("Buchung", params.bookingNumber, true)}
      ${zeile("Kennzeichen", params.kennzeichen)}
      ${zeile("Kunde", params.kundeName)}
      ${zeile("Fahrer", params.fahrer)}
      ${zeile("Kilometerstand", params.kmStand != null ? `${params.kmStand.toLocaleString("de-DE")} km` : "–")}
      ${zeile("Tank-/Ladestand", params.tankstand ?? "–")}
    </table>
    <p style="font-size:13px;color:#666;">Das vollständige Protokoll inkl. Fotos und Unterschrift findest du im PDF-Anhang.</p>
  `);

  const datei = `Uebergabeprotokoll_${params.bookingNumber}_${params.phaseLabel.replace(/[^a-zA-Z]/g, "")}.pdf`;
  await sende(
    params.an,
    `Übergabeprotokoll ${params.bookingNumber} (${params.phaseLabel}) – ${params.kennzeichen}`,
    html,
    [{ filename: datei, content: params.pdf }]
  );
}
