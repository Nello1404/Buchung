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
  <div style="background:#f4f2ee; padding:24px 0; font-family: Arial, Helvetica, sans-serif;">
    <div style="max-width: 560px; margin: 0 auto; background:#ffffff; border:1px solid #e7e3da; border-radius:14px; overflow:hidden;">
      <div style="background:#14171e; padding:22px 28px;">
        <span style="font-size: 22px; font-weight: 700; letter-spacing: 1px;">
          <span style="color: #d3b877;">FlySpot</span><span style="color: #9aa0a8;"> Valet</span>
        </span>
        <div style="height:2px; width:44px; background:#c8a45c; margin-top:10px;"></div>
      </div>
      <div style="padding: 26px 28px; color:#1a1a1a; line-height:1.55;">
        ${inhalt}
      </div>
      <div style="border-top:1px solid #eee; padding:16px 28px; background:#faf9f6;">
        <p style="font-size: 12px; color: #8a8a8a; margin:0;">
          FlySpot Valet · Flughafen Frankfurt · www.flyspot-valet.de<br />
          Diese E-Mail wurde automatisch generiert.
        </p>
      </div>
    </div>
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
    <h2 style="font-size:19px; margin:0 0 6px; color:#14171e;">Buchung bestätigt</h2>
    <p style="margin:0 0 18px; color:#555;">Vielen Dank für Ihre Buchung bei FlySpot Valet.</p>

    <div style="border:1px solid #ece6d8; background:#faf6ec; border-radius:10px; padding:14px 18px; margin-bottom:18px;">
      <div style="font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#9c7c38;">Buchungsnummer</div>
      <div style="font-size:22px; font-weight:700; color:#14171e; letter-spacing:0.5px;">${bookingNumber}</div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin: 0 0 18px;">
      ${zeile("Produkt", produktName)}
      ${zeile("Anreise", `${formatDatum.format(anreise)} Uhr`)}
      ${zeile("Abreise", `${formatDatum.format(abreise)} Uhr`)}
      ${flugnummer ? zeile("Flugnummer (Rückflug)", flugnummer) : ""}
      ${zeile("Gesamtpreis", centToEUR(preisGesamtCent), true)}
    </table>

    <p style="margin:0 0 6px; font-weight:bold; color:#14171e;">So funktioniert's</p>
    <p style="margin:0; color:#555;">Bitte fahren Sie zur vereinbarten Zeit direkt zum Valet-/Shuttle-Terminal am Flughafen
    Frankfurt und nennen Sie Ihre Buchungsnummer. Unser Team empfängt Sie dort. Eine kostenlose
    Stornierung ist bis 48 Stunden vor Anreise möglich (danach 50 % Erstattung).</p>
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

/** HTML-Sonderzeichen in Freitext maskieren (Anfragen enthalten Nutzereingaben). */
function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Neue FlySpot-Service-Anfrage ans Team melden. */
export async function sendeServiceAnfrageTeam(params: {
  an: string;
  name: string;
  email: string;
  telefon?: string | null;
  kennzeichen?: string | null;
  fahrzeug?: string | null;
  wunschtermin?: string | null;
  leistungen: string;
  nachricht?: string | null;
  erstelltAm: Date;
}) {
  const html = baseLayout(`
    <h2 style="font-size: 17px; margin: 0 0 4px;">Neue Service-Anfrage</h2>
    <p style="color:#666; margin-top:0;">Eingegangen am ${formatDatum.format(params.erstelltAm)} Uhr.</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      ${zeile("Name", esc(params.name), true)}
      ${zeile("E-Mail", esc(params.email))}
      ${zeile("Telefon", esc(params.telefon) || "–")}
      ${zeile("Kennzeichen", esc(params.kennzeichen) || "–")}
      ${zeile("Fahrzeug", esc(params.fahrzeug) || "–")}
      ${zeile("Wunschtermin", esc(params.wunschtermin) || "–")}
      ${zeile("Leistungen", esc(params.leistungen))}
    </table>
    ${params.nachricht ? `<p style="margin:0 0 4px;color:#666;">Nachricht:</p><p style="margin-top:0;white-space:pre-wrap;">${esc(params.nachricht)}</p>` : ""}
    <p style="font-size:13px;color:#666;">Die Anfrage ist auch im Admin unter „Service-Anfragen“ sichtbar.</p>
  `);
  await sende(params.an, `Service-Anfrage von ${params.name}`, html);
}

/** Eingangsbestätigung an den Kunden. */
export async function sendeServiceAnfrageKunde(params: {
  an: string;
  name: string;
  leistungen: string;
}) {
  const html = baseLayout(`
    <p>Hallo ${esc(params.name)},</p>
    <p>vielen Dank für Ihre Anfrage bei FlySpot Service. Wir haben folgende Leistungen erhalten:</p>
    <p style="font-weight:bold;">${esc(params.leistungen)}</p>
    <p>Wir prüfen Ihre Anfrage und melden uns zeitnah mit einem persönlichen Angebot bei Ihnen.</p>
    <p>Ihr FlySpot-Team</p>
  `);
  await sende(params.an, "Ihre Anfrage bei FlySpot Service", html);
}

/** Persönlichen Einsatzplan (Schichten im Zeitraum) an einen Mitarbeiter senden. */
export async function sendeEinsatzplan(params: {
  an: string;
  name: string;
  zeitraumLabel: string;
  schichten: { datumLabel: string; vonZeit: string; bisZeit: string; notiz: string | null }[];
  feedUrl?: string | null;
}) {
  const zeilen = params.schichten.length
    ? params.schichten
        .map(
          (s) => `<tr>
        <td style="padding:6px 10px 6px 0;color:#666;white-space:nowrap;">${esc(s.datumLabel)}</td>
        <td style="padding:6px 0;font-weight:bold;white-space:nowrap;">${esc(s.vonZeit)}–${esc(s.bisZeit)} Uhr</td>
        <td style="padding:6px 0 6px 10px;color:#333;">${esc(s.notiz) || ""}</td>
      </tr>`
        )
        .join("")
    : `<tr><td colspan="3" style="padding:10px 0;color:#666;">Für diesen Zeitraum sind aktuell keine Einsätze geplant.</td></tr>`;

  const html = baseLayout(`
    <h2 style="font-size: 17px; margin: 0 0 4px;">Ihr Einsatzplan</h2>
    <p style="color:#666; margin-top:0;">Hallo ${esc(params.name)}, hier Ihr Plan für ${esc(params.zeitraumLabel)}:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">${zeilen}</table>
    ${
      params.feedUrl
        ? `<p style="font-size:13px;color:#666;">Tipp: Sie können Ihren Plan dauerhaft im Handy-Kalender abonnieren (Google, Apple, Outlook). Link:<br /><a href="${esc(params.feedUrl)}" style="color:#9c7c38;">${esc(params.feedUrl)}</a></p>`
        : ""
    }
    <p style="font-size:13px;color:#666;">Änderungen vorbehalten. Bei Fragen wenden Sie sich bitte an die Einsatzleitung.</p>
  `);

  await sende(params.an, `Einsatzplan ${params.zeitraumLabel} · FlySpot Valet`, html);
}
