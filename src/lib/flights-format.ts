// Client-sichere Typen & Anzeige-Logik fürs Flugtracking (kein Prisma-Import).

export interface FlugStatus {
  flightNumber: string;
  datum: string;
  status: string | null;
  scheduledArrival: string | null; // ISO
  estimatedArrival: string | null; // ISO
  actualArrival: string | null; // ISO
  arrivalAirport: string | null;
  nichtGefunden: boolean;
  konfiguriert: boolean;
}

const uhrzeit = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  hour: "2-digit",
  minute: "2-digit",
});

export type Ampel = "gruen" | "gelb" | "rot" | "grau";

export interface FlugAnzeige {
  text: string;
  ampel: Ampel;
  /// Die für die Planung maßgebliche Ankunftszeit (ISO) – tatsächlich > geschätzt > planmäßig.
  ankunftISO: string | null;
  verspaetungMin: number | null;
}

function fmt(iso: string | null): string {
  if (!iso) return "";
  return uhrzeit.format(new Date(iso));
}

export function flugAnzeige(fs: FlugStatus | null): FlugAnzeige {
  if (!fs) return { text: "–", ampel: "grau", ankunftISO: null, verspaetungMin: null };
  if (!fs.konfiguriert) return { text: "Flug-Tracking nicht aktiv", ampel: "grau", ankunftISO: null, verspaetungMin: null };
  if (fs.nichtGefunden) return { text: "Flug nicht gefunden", ampel: "grau", ankunftISO: null, verspaetungMin: null };

  const s = (fs.status ?? "").toLowerCase();
  if (s.includes("cancel") || s === "canceled") return { text: "Annulliert", ampel: "rot", ankunftISO: null, verspaetungMin: null };
  if (s.includes("divert")) return { text: "Umgeleitet", ampel: "rot", ankunftISO: null, verspaetungMin: null };

  // Verspätung = geschätzt vs. planmäßig
  let verspaetungMin: number | null = null;
  if (fs.estimatedArrival && fs.scheduledArrival) {
    verspaetungMin = Math.round(
      (new Date(fs.estimatedArrival).getTime() - new Date(fs.scheduledArrival).getTime()) / 60000
    );
  }

  const gelandet = Boolean(fs.actualArrival) || s === "arrived";
  if (gelandet) {
    const zeit = fmt(fs.actualArrival ?? fs.estimatedArrival ?? fs.scheduledArrival);
    return { text: `Gelandet${zeit ? ` ${zeit} Uhr` : ""}`, ampel: "gruen", ankunftISO: fs.actualArrival ?? fs.scheduledArrival, verspaetungMin };
  }

  const ankunftISO = fs.estimatedArrival ?? fs.scheduledArrival;
  const zeit = fmt(ankunftISO);
  if (verspaetungMin != null && verspaetungMin >= 15) {
    return { text: `Verspätet – landet ${zeit} Uhr (+${verspaetungMin} min)`, ampel: "gelb", ankunftISO, verspaetungMin };
  }
  return { text: `Landet ${zeit} Uhr`, ampel: "gruen", ankunftISO, verspaetungMin };
}

export function normalisiereFlugnummer(nr: string): string {
  return nr.replace(/\s+/g, "").toUpperCase();
}
