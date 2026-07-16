import { toZonedTime, fromZonedTime } from "date-fns-tz";

export const ZEITZONE = "Europe/Berlin";

/**
 * Bestimmt, welchem Kalendertag ein Zeitpunkt in Europe/Berlin angehört (unter
 * Berücksichtigung der Sommer-/Winterzeit), und liefert diesen Tag als reinen
 * UTC-Mitternachts-Zeitstempel zurück (Y-M-D, ohne Uhrzeit). Diese "date-only"
 * Repräsentation entspricht exakt dem, was Postgres @db.Date-Spalten liefern, und
 * lässt sich damit direkt vergleichen sowie unproblematisch tageweise per
 * setUTCDate() weiterzählen (keine erneute DST-Umrechnung nötig).
 */
export function berlinKalendertag(date: Date): Date {
  const zoned = toZonedTime(date, ZEITZONE);
  return new Date(Date.UTC(zoned.getFullYear(), zoned.getMonth(), zoned.getDate()));
}

const MS_PRO_TAG = 24 * 60 * 60 * 1000;

/** Anzahl voller Kalendertage zwischen Anreise- und Abreisedatum (Europe/Berlin). */
export function anzahlTage(anreise: Date, abreise: Date): number {
  const start = berlinKalendertag(anreise);
  const ende = berlinKalendertag(abreise);
  const diffTage = Math.round((ende.getTime() - start.getTime()) / MS_PRO_TAG);
  return Math.max(diffTage, 1);
}

/**
 * Liste der Kalendertage, die das Fahrzeug bei uns steht: vom Anreisetag (inklusive)
 * bis zum Tag vor der Abreise (der Abreisetag selbst zählt nicht mehr, da das Fahrzeug
 * an diesem Tag bereits abgeholt wird). Diese Liste bestimmt sowohl die Preis- als auch
 * die Kapazitätsberechnung.
 */
export function belegteTage(anreise: Date, abreise: Date): Date[] {
  const start = berlinKalendertag(anreise);
  const tage = anzahlTage(anreise, abreise);
  const result: Date[] = [];
  for (let i = 0; i < tage; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    result.push(d);
  }
  return result;
}

export function istGleicherTag(a: Date, b: Date): boolean {
  return berlinKalendertag(a).getTime() === berlinKalendertag(b).getTime();
}

export function liegtImZeitraum(tag: Date, start: Date, ende: Date): boolean {
  const t = berlinKalendertag(tag).getTime();
  return t >= berlinKalendertag(start).getTime() && t <= berlinKalendertag(ende).getTime();
}

/**
 * Baut aus einem Datum ("YYYY-MM-DD") und einer Uhrzeit ("HH:mm") – gemeint als
 * Wanduhrzeit in Europe/Berlin – den korrekten UTC-Zeitpunkt, unabhängig von der
 * Zeitzone, in der der Server-Prozess selbst läuft (Sommer-/Winterzeit wird über die
 * IANA-Zeitzonendaten korrekt berücksichtigt).
 */
export function berlinZeitpunkt(datum: string, zeit: string): Date {
  const [jahr, monat, tag] = datum.split("-").map(Number);
  const [stunde, minute] = zeit.split(":").map(Number);
  const naiv = new Date(Date.UTC(jahr, monat - 1, tag, stunde, minute));
  return fromZonedTime(naiv, ZEITZONE);
}
