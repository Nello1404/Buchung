"use client";

import { useCallback, useEffect, useState } from "react";
import type { getTvData } from "@/lib/cockpit";
import { BrandLogo } from "@/components/BrandLogo";

type TvData = Awaited<ReturnType<typeof getTvData>>;
const POLL_MS = 20000;

function uhr(iso: string) {
  return new Date(iso).toLocaleTimeString("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
}

export function TvBoard({ initial }: { initial: TvData }) {
  const [data, setData] = useState<TvData>(initial);

  const lade = useCallback(async () => {
    try {
      const res = await fetch("/api/cockpit/tv-data", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {
      /* nächster Poll */
    }
  }, []);

  useEffect(() => {
    const id = setInterval(lade, POLL_MS);
    return () => clearInterval(id);
  }, [lade]);

  const h = data.heute;
  const jetzt = new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin", dateStyle: "full", timeStyle: "short" });

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="flex items-center justify-between">
        <BrandLogo href={null} imgClassName="h-16 w-auto" />
        <span className="text-sm text-muted">{jetzt} Uhr</span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <TvKachel label="Ankünfte offen" wert={h.ankuenfteOffen} gross />
        <TvKachel label="Abholungen offen" wert={h.abholungenOffen} gross />
        <TvKachel label="Autos auf Platz" wert={h.physischeBelegung} gross />
        {h.auslastung.map((a) => (
          <TvKachel key={a.code} label={`${a.code === "VALET" ? "Valet" : "Shuttle"} Auslastung`} wert={`${a.prozent}%`} />
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <TvListe titel="Ankünfte heute" eintraege={data.ankuenfte} />
        <TvListe titel="Abholungen heute" eintraege={data.abholungen} />
      </div>
    </div>
  );
}

function TvKachel({ label, wert, gross }: { label: string; wert: number | string; gross?: boolean }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-subtle">{label}</div>
      <div className={`mt-2 font-serif font-semibold text-ink ${gross ? "text-5xl" : "text-3xl"}`}>{wert}</div>
    </div>
  );
}

type Eintrag = TvData["ankuenfte"][number];

function TvListe({ titel, eintraege }: { titel: string; eintraege: Eintrag[] }) {
  const erledigt = (s: string) => ["UEBERGEBEN", "GEPARKT", "BEREITGESTELLT", "ABGESCHLOSSEN"].includes(s);
  return (
    <div className="card p-5">
      <h2 className="mb-3 text-lg font-medium text-ink">{titel} ({eintraege.length})</h2>
      {eintraege.length === 0 ? (
        <p className="text-muted">Keine Einträge.</p>
      ) : (
        <table className="w-full text-base">
          <tbody>
            {eintraege.map((e) => (
              <tr key={e.id} className="border-b border-line last:border-0">
                <td className="py-2.5 pr-3 font-medium text-gold">{uhr(e.uhrzeitISO)}</td>
                <td className="py-2.5 pr-3 text-ink">{e.kunde}</td>
                <td className="py-2.5 pr-3 text-muted">{e.kennzeichen ?? "–"}</td>
                <td className="py-2.5 pr-3 text-muted">{e.flugnummer ? `✈ ${e.flugnummer}` : ""}</td>
                <td className="py-2.5 text-right">{erledigt(e.status) ? <span className="text-[var(--success)]">✓</span> : <span className="text-subtle">offen</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
