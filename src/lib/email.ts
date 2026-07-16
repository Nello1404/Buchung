import { Resend } from "resend";

let client: Resend | undefined;

function getResend(): Resend | undefined {
  const key = process.env.RESEND_API_KEY;
  if (!key) return undefined;
  if (!client) client = new Resend(key);
  return client;
}

const EMAIL_FROM = process.env.EMAIL_FROM || "FlySpot Valet <buchung@flyspot-valet.de>";

async function sende(an: string, betreff: string, html: string) {
  const resend = getResend();
  if (!resend) {
    console.log(
      `[E-Mail nicht gesendet – RESEND_API_KEY fehlt] An: ${an} | Betreff: ${betreff}\n${html}`
    );
    return;
  }
  await resend.emails.send({ from: EMAIL_FROM, to: an, subject: betreff, html });
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

function baseLayout(inhalt: string) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
    <h1 style="font-size: 20px; color: #0b3d91;">FlySpot Valet</h1>
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
