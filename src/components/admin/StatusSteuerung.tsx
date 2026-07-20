"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDatumZeit } from "@/lib/format";

const FLOW = ["BEZAHLT", "UEBERGEBEN", "GEPARKT", "BEREITGESTELLT", "ABGESCHLOSSEN"] as const;
type Status = (typeof FLOW)[number];
const LABEL: Record<Status, string> = {
  BEZAHLT: "Bezahlt / erwartet",
  UEBERGEBEN: "Auto übernommen",
  GEPARKT: "Geparkt",
  BEREITGESTELLT: "Bereitgestellt",
  ABGESCHLOSSEN: "Abgeschlossen",
};

interface Props {
  bookingId: string;
  status: string;
  stellplatz: string | null;
  events: { status: string; createdAt: string; von: string | null }[];
}

export function StatusSteuerung({ bookingId, status, stellplatz, events }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [platz, setPlatz] = useState(stellplatz ?? "");
  const [platzOffen, setPlatzOffen] = useState(false);

  const aktuellerIndex = FLOW.indexOf(status as Status);
  const naechster = aktuellerIndex >= 0 && aktuellerIndex < FLOW.length - 1 ? FLOW[aktuellerIndex + 1] : null;

  // Zeitpunkt je Schritt aus dem Verlauf (erster Event dieses Status).
  const zeitFuer = (s: Status): string | null => {
    const e = events.find((ev) => ev.status === s);
    return e ? e.createdAt : null;
  };

  async function senden(body: { status?: Status; stellplatz?: string }) {
    setBusy(true);
    setFehler(null);
    try {
      const res = await fetch(`/api/admin/buchungen/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) {
        setFehler(d.error ?? "Aktion fehlgeschlagen.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setFehler("Aktion fehlgeschlagen.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function weiter() {
    if (!naechster) return;
    // Beim Schritt „Geparkt" den Stellplatz gleich miterfassen.
    if (naechster === "GEPARKT") {
      await senden({ status: "GEPARKT", stellplatz: platz.trim() });
    } else {
      await senden({ status: naechster });
    }
  }

  const istStorniert = status === "STORNIERT";
  const zeigeStellplatz = ["GEPARKT", "BEREITGESTELLT"].includes(status) || naechster === "GEPARKT";

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-ink">Ablauf</h2>
        {status === "GEPARKT" && stellplatz && (
          <span className="rounded-full border border-line-gold bg-[rgba(200,164,92,0.1)] px-3 py-1 text-sm font-medium text-gold">
            📍 {stellplatz}
          </span>
        )}
      </div>

      {istStorniert ? (
        <p className="mt-3 text-sm text-[var(--danger)]">Diese Buchung ist storniert.</p>
      ) : (
        <>
          {/* Zeitleiste */}
          <ol className="mt-4 space-y-2.5">
            {FLOW.map((s, i) => {
              const erledigt = aktuellerIndex >= 0 && i <= aktuellerIndex;
              const aktiv = i === aktuellerIndex;
              const zeit = zeitFuer(s);
              return (
                <li key={s} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                      erledigt ? "border-line-gold bg-[rgba(200,164,92,0.15)] text-gold" : "border-line text-subtle"
                    }`}
                  >
                    {erledigt ? "✓" : i + 1}
                  </span>
                  <div className="flex-1">
                    <span className={`text-sm ${aktiv ? "font-medium text-ink" : erledigt ? "text-ink" : "text-subtle"}`}>
                      {LABEL[s]}
                    </span>
                    {zeit && (
                      <span className="ml-2 text-xs text-subtle">{formatDatumZeit.format(new Date(zeit))} Uhr</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Stellplatz erfassen/ändern */}
          {zeigeStellplatz && (
            <div className="mt-4 rounded-lg border border-line bg-surface-2 p-3">
              <label className="block text-sm font-medium text-ink">Stellplatz / Reihe</label>
              <div className="mt-1.5 flex gap-2">
                <input
                  value={platz}
                  onChange={(e) => setPlatz(e.target.value)}
                  onFocus={() => setPlatzOffen(true)}
                  placeholder="z. B. Reihe C / 12"
                  className="field flex-1"
                />
                {(platzOffen || platz !== (stellplatz ?? "")) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => { if (await senden({ stellplatz: platz.trim() })) setPlatzOffen(false); }}
                    className="btn-outline !px-4 !py-2 text-sm"
                  >
                    Speichern
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-subtle">Wird bei der Abholung angezeigt – damit das Auto sofort gefunden wird.</p>
            </div>
          )}

          {fehler && <p className="mt-3 text-sm text-[var(--danger)]">{fehler}</p>}

          {/* Weiter-Button */}
          {naechster && (
            <button
              type="button"
              disabled={busy}
              onClick={weiter}
              className="btn-gold mt-4 w-full"
            >
              {busy ? "…" : `Weiter: ${LABEL[naechster]}`}
              {naechster === "GEPARKT" && " (mit Stellplatz)"}
            </button>
          )}
          {!naechster && aktuellerIndex === FLOW.length - 1 && (
            <p className="mt-4 text-center text-sm text-[var(--success)]">✓ Abgeschlossen – Fahrzeug zurückgegeben.</p>
          )}

          {/* Korrektur (Status manuell setzen) */}
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-subtle hover:text-ink">Status manuell korrigieren</summary>
            <div className="mt-2 flex flex-wrap gap-2">
              {FLOW.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy || s === status}
                  onClick={() => senden({ status: s })}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    s === status ? "border-line-gold text-gold" : "border-line text-muted hover:text-ink"
                  }`}
                >
                  {LABEL[s]}
                </button>
              ))}
            </div>
          </details>
        </>
      )}
    </div>
  );
}
