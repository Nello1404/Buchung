/**
 * Minimaler iCalendar-Generator (RFC 5545) für den abonnierbaren Einsatzplan.
 * Zeiten werden als "floating" lokale Zeit ausgegeben (ohne Zeitzone) – für ein
 * Team in einer Zeitzone (Europe/Berlin) ist das robust und wird von Google,
 * Apple und Outlook korrekt angezeigt.
 */

export interface ICalEvent {
  uid: string;
  /** Startdatum als "YYYY-MM-DD". */
  datum: string;
  /** "HH:MM". */
  vonZeit: string;
  /** "HH:MM". */
  bisZeit: string;
  titel: string;
  beschreibung?: string | null;
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function floating(datum: string, zeit: string): string {
  const [j, m, t] = datum.split("-");
  const [hh, mm] = zeit.split(":");
  return `${j}${m}${t}T${hh}${mm}00`;
}

function jetztUtc(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Lange Zeilen gemäß RFC 5545 auf 75 Oktett falten. */
function falten(zeile: string): string {
  if (zeile.length <= 73) return zeile;
  const teile: string[] = [];
  let rest = zeile;
  teile.push(rest.slice(0, 73));
  rest = rest.slice(73);
  while (rest.length > 72) {
    teile.push(" " + rest.slice(0, 72));
    rest = rest.slice(72);
  }
  teile.push(" " + rest);
  return teile.join("\r\n");
}

export function baueICal(kalenderName: string, events: ICalEvent[]): string {
  const zeilen: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FlySpot Valet//Einsatzplan//DE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(kalenderName)}`,
    "X-WR-TIMEZONE:Europe/Berlin",
  ];

  const stamp = jetztUtc();
  for (const e of events) {
    zeilen.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${floating(e.datum, e.vonZeit)}`,
      `DTEND:${floating(e.datum, e.bisZeit)}`,
      falten(`SUMMARY:${escapeText(e.titel)}`)
    );
    if (e.beschreibung) zeilen.push(falten(`DESCRIPTION:${escapeText(e.beschreibung)}`));
    zeilen.push("END:VEVENT");
  }

  zeilen.push("END:VCALENDAR");
  return zeilen.join("\r\n") + "\r\n";
}
