import { prisma } from "@/lib/prisma";
import { normalisiereFlugnummer, type FlugStatus } from "@/lib/flights-format";

const HOST = "aerodatabox.p.rapidapi.com";
const FRISCH_MIN = 15; // reguläre Aktualisierung
const FRISCH_GELANDET_MIN = 360; // gelandete Flüge selten aktualisieren

function apiKey(): string | undefined {
  return process.env.AERODATABOX_API_KEY;
}

export function flugTrackingKonfiguriert(): boolean {
  return Boolean(apiKey());
}

function parseUtc(t: unknown): Date | null {
  // AeroDataBox-Format: { utc: "2026-07-18 14:30Z", local: "..." }
  const utc = (t as { utc?: string } | null | undefined)?.utc;
  if (!utc) return null;
  const d = new Date(utc.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

interface ApiErgebnis {
  status: string | null;
  scheduled: Date | null;
  estimated: Date | null;
  actual: Date | null;
  arrivalAirport: string | null;
  gefunden: boolean;
}

// Fragt AeroDataBox ab und filtert auf die Ankunft in Frankfurt (FRA).
async function ausApi(flightNumber: string, datum: string): Promise<ApiErgebnis | null> {
  const key = apiKey();
  if (!key) return null;
  const url = `https://${HOST}/flights/number/${encodeURIComponent(flightNumber)}/${datum}?withAircraftImage=false&withLocation=false`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": HOST },
      cache: "no-store",
    });
  } catch (e) {
    console.error("AeroDataBox-Abfrage fehlgeschlagen:", e);
    return null;
  }
  if (res.status === 204 || res.status === 404) {
    return { status: null, scheduled: null, estimated: null, actual: null, arrivalAirport: null, gefunden: false };
  }
  if (!res.ok) {
    console.error("AeroDataBox HTTP", res.status, await res.text().catch(() => ""));
    return null;
  }
  const daten = (await res.json().catch(() => null)) as unknown;
  const liste = Array.isArray(daten) ? daten : [];
  if (liste.length === 0) {
    return { status: null, scheduled: null, estimated: null, actual: null, arrivalAirport: null, gefunden: false };
  }

  type Flug = { status?: string; arrival?: { airport?: { iata?: string }; scheduledTime?: unknown; revisedTime?: unknown; predictedTime?: unknown; runwayTime?: unknown; actualTime?: unknown } };
  const flüge = liste as Flug[];
  const fra = flüge.find((f) => f.arrival?.airport?.iata === "FRA") ?? flüge[0];
  const a = fra.arrival ?? {};

  return {
    status: fra.status ?? null,
    scheduled: parseUtc(a.scheduledTime),
    estimated: parseUtc(a.revisedTime) ?? parseUtc(a.predictedTime),
    actual: parseUtc(a.runwayTime) ?? parseUtc(a.actualTime),
    arrivalAirport: a.airport?.iata ?? null,
    gefunden: true,
  };
}

function zuFlugStatus(row: {
  flightNumber: string;
  datum: string;
  status: string | null;
  scheduledArrival: Date | null;
  estimatedArrival: Date | null;
  actualArrival: Date | null;
  arrivalAirport: string | null;
  nichtGefunden: boolean;
}): FlugStatus {
  return {
    flightNumber: row.flightNumber,
    datum: row.datum,
    status: row.status,
    scheduledArrival: row.scheduledArrival?.toISOString() ?? null,
    estimatedArrival: row.estimatedArrival?.toISOString() ?? null,
    actualArrival: row.actualArrival?.toISOString() ?? null,
    arrivalAirport: row.arrivalAirport,
    nichtGefunden: row.nichtGefunden,
    konfiguriert: true,
  };
}

/**
 * Liefert den (zwischengespeicherten) Flugstatus für Flugnummer + Ankunftsdatum.
 * Frische Daten werden nur bei Bedarf nachgeladen (schont das API-Kontingent).
 */
export async function getFlugStatus(flugnummerRoh: string, datum: string): Promise<FlugStatus> {
  const flightNumber = normalisiereFlugnummer(flugnummerRoh);
  if (!flugTrackingKonfiguriert()) {
    return {
      flightNumber, datum, status: null, scheduledArrival: null, estimatedArrival: null,
      actualArrival: null, arrivalAirport: null, nichtGefunden: false, konfiguriert: false,
    };
  }

  const cached = await prisma.flightStatus.findUnique({ where: { flightNumber_datum: { flightNumber, datum } } });
  if (cached) {
    const alterMin = (Date.now() - cached.fetchedAt.getTime()) / 60000;
    const ttl = cached.actualArrival ? FRISCH_GELANDET_MIN : FRISCH_MIN;
    if (alterMin < ttl) return zuFlugStatus(cached);
  }

  const api = await ausApi(flightNumber, datum);
  if (!api) {
    // Abruf fehlgeschlagen → vorhandenen (ggf. veralteten) Stand zurückgeben.
    return cached
      ? zuFlugStatus(cached)
      : { flightNumber, datum, status: null, scheduledArrival: null, estimatedArrival: null, actualArrival: null, arrivalAirport: null, nichtGefunden: false, konfiguriert: true };
  }

  const gespeichert = await prisma.flightStatus.upsert({
    where: { flightNumber_datum: { flightNumber, datum } },
    create: {
      flightNumber, datum, status: api.status, scheduledArrival: api.scheduled,
      estimatedArrival: api.estimated, actualArrival: api.actual, arrivalAirport: api.arrivalAirport,
      nichtGefunden: !api.gefunden,
    },
    update: {
      status: api.status, scheduledArrival: api.scheduled, estimatedArrival: api.estimated,
      actualArrival: api.actual, arrivalAirport: api.arrivalAirport, nichtGefunden: !api.gefunden,
      fetchedAt: new Date(),
    },
  });
  return zuFlugStatus(gespeichert);
}

/** Ankunftsdatum (YYYY-MM-DD, Europe/Berlin) aus dem Abreise-Zeitpunkt der Buchung. */
export function ankunftsDatum(abreise: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(abreise);
}
