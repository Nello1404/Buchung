"use client";

import { useEffect, useState } from "react";
import { flugAnzeige, type Ampel, type FlugStatus } from "@/lib/flights-format";

const punkt: Record<Ampel, string> = {
  gruen: "bg-[#6fae7d]",
  gelb: "bg-[#d9b25e]",
  rot: "bg-[#d98a80]",
  grau: "bg-[var(--text-subtle)]",
};

const textFarbe: Record<Ampel, string> = {
  gruen: "text-[#6fae7d]",
  gelb: "text-[#d9b25e]",
  rot: "text-[#d98a80]",
  grau: "text-subtle",
};

type Antwort =
  | ({ hatRueckflug: true } & FlugStatus)
  | { hatRueckflug: false; konfiguriert: boolean };

export function FlugStatusBadge({ bookingId }: { bookingId: string }) {
  const [antwort, setAntwort] = useState<Antwort | null>(null);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    let abbruch = false;
    const lade = () =>
      fetch(`/api/flights/status?bookingId=${bookingId}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (abbruch || !d) return;
          setAntwort(d);
          setGeladen(true);
        })
        .catch(() => {});
    lade();
    const id = setInterval(lade, 60000); // jede Minute aktualisieren
    return () => {
      abbruch = true;
      clearInterval(id);
    };
  }, [bookingId]);

  if (!geladen) return <span className="text-xs text-subtle">Flugstatus lädt …</span>;
  if (!antwort) return null;

  if (!antwort.hatRueckflug) {
    return (
      <span className="text-xs text-subtle">
        {antwort.konfiguriert ? "Keine Rückflugnummer hinterlegt" : "Flug-Tracking nicht aktiv"}
      </span>
    );
  }

  const a = flugAnzeige(antwort);
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={`h-2 w-2 rounded-full ${punkt[a.ampel]}`} />
      <span className={textFarbe[a.ampel]}>{a.text}</span>
    </span>
  );
}
