"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface Mitarbeiter {
  id: string;
  name: string;
  rolle: string | null;
  email: string | null;
  feedToken: string;
}
interface Schicht {
  id: string;
  mitarbeiterId: string;
  datum: string; // YYYY-MM-DD
  vonZeit: string;
  bisZeit: string;
  notiz: string | null;
}

type Ansicht = "woche" | "monat";

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function montag(d: Date): Date {
  const x = new Date(d);
  const wd = (x.getDay() + 6) % 7; // Mo=0
  x.setDate(x.getDate() - wd);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addTage(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const tagFmt = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
const bereichFmt = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
const monatFmt = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });

export function EinsatzplanEditor({ basisUrl }: { basisUrl: string }) {
  const [ansicht, setAnsicht] = useState<Ansicht>("woche");
  const [anker, setAnker] = useState(() => new Date());
  const [mitarbeiter, setMitarbeiter] = useState<Mitarbeiter[]>([]);
  const [schichten, setSchichten] = useState<Schicht[]>([]);
  const [laden, setLaden] = useState(true);
  const [editing, setEditing] = useState<{ mitarbeiterId: string; datum: string; schicht?: Schicht } | null>(null);
  const [versendStatus, setVersendStatus] = useState<string | null>(null);
  const [zeigeLinks, setZeigeLinks] = useState(false);

  // Sichtbarer Zeitraum.
  const tage = useMemo(() => {
    if (ansicht === "woche") {
      const start = montag(anker);
      return Array.from({ length: 7 }, (_, i) => addTage(start, i));
    }
    const start = new Date(anker.getFullYear(), anker.getMonth(), 1);
    const anzahl = new Date(anker.getFullYear(), anker.getMonth() + 1, 0).getDate();
    return Array.from({ length: anzahl }, (_, i) => addTage(start, i));
  }, [ansicht, anker]);

  const von = iso(tage[0]);
  const bis = iso(tage[tage.length - 1]);

  const laden_ = useCallback(async () => {
    setLaden(true);
    try {
      const res = await fetch(`/api/admin/einsatzplan?von=${von}&bis=${bis}`);
      const d = await res.json();
      if (res.ok) {
        setMitarbeiter(d.mitarbeiter ?? []);
        setSchichten(d.schichten ?? []);
      }
    } finally {
      setLaden(false);
    }
  }, [von, bis]);

  useEffect(() => {
    const t = setTimeout(() => laden_(), 0);
    return () => clearTimeout(t);
  }, [laden_]);

  function schichtenFuer(mid: string, datum: string): Schicht[] {
    return schichten.filter((s) => s.mitarbeiterId === mid && s.datum === datum);
  }

  function blaettern(richtung: -1 | 1) {
    setAnker((a) => (ansicht === "woche" ? addTage(a, richtung * 7) : new Date(a.getFullYear(), a.getMonth() + richtung, 1)));
  }

  async function versenden() {
    const label = ansicht === "woche" ? "diese Woche" : "diesen Monat";
    if (!confirm(`Einsatzplan für ${label} (${bereichFmt.format(tage[0])} – ${bereichFmt.format(tage[tage.length - 1])}) an alle Mitarbeiter mit E-Mail senden?`)) return;
    setVersendStatus("Wird gesendet …");
    try {
      const res = await fetch("/api/admin/einsatzplan/versenden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ von, bis }),
      });
      const d = await res.json();
      if (!res.ok) {
        setVersendStatus(d.error ?? "Versand fehlgeschlagen.");
      } else {
        setVersendStatus(
          `${d.gesendet} E-Mail(s) versendet.` + (d.ohneAdresse > 0 ? ` ${d.ohneAdresse} aktive(r) Mitarbeiter ohne E-Mail übersprungen.` : "")
        );
      }
    } catch {
      setVersendStatus("Versand fehlgeschlagen.");
    }
  }

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="inline-flex overflow-hidden rounded-lg border border-line">
          {(["woche", "monat"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAnsicht(a)}
              className={`px-4 py-2 text-sm ${ansicht === a ? "bg-[rgba(200,164,92,0.12)] text-gold" : "text-muted hover:text-ink"}`}
            >
              {a === "woche" ? "Woche" : "Monat"}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center gap-2">
          <button onClick={() => blaettern(-1)} className="rounded-lg border border-line px-3 py-2 text-sm text-muted hover:text-ink">←</button>
          <button onClick={() => setAnker(new Date())} className="rounded-lg border border-line px-3 py-2 text-sm text-muted hover:text-ink">Heute</button>
          <button onClick={() => blaettern(1)} className="rounded-lg border border-line px-3 py-2 text-sm text-muted hover:text-ink">→</button>
        </div>

        <span className="text-sm font-medium text-ink">
          {ansicht === "woche"
            ? `${bereichFmt.format(tage[0])} – ${bereichFmt.format(tage[tage.length - 1])}`
            : monatFmt.format(tage[0])}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <button onClick={() => setZeigeLinks((v) => !v)} className="text-sm text-muted hover:text-ink">
            Kalender abonnieren
          </button>
          <button onClick={versenden} className="btn-gold">Plan versenden</button>
        </div>
      </div>

      {versendStatus && <p className="mt-3 text-sm text-gold">{versendStatus}</p>}

      {zeigeLinks && (
        <div className="mt-4 card p-5">
          <h2 className="text-sm font-medium text-ink">Kalender-Abo-Links (pro Mitarbeiter)</h2>
          <p className="mt-1 text-xs text-subtle">
            Diesen Link im Handy-Kalender „Kalender abonnieren“ einfügen (Google, Apple, Outlook). Der Plan
            aktualisiert sich dann automatisch. Behandeln Sie den Link vertraulich.
          </p>
          <div className="mt-3 space-y-2">
            {mitarbeiter.map((m) => {
              const url = `${basisUrl}/api/kalender/${m.feedToken}`;
              return (
                <div key={m.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="min-w-[140px] text-ink">{m.name}</span>
                  <code className="flex-1 truncate rounded bg-[rgba(0,0,0,0.04)] px-2 py-1 text-xs text-muted">{url}</code>
                  <button
                    onClick={() => navigator.clipboard?.writeText(url)}
                    className="rounded-lg border border-line px-2 py-1 text-xs text-muted hover:text-ink"
                  >
                    Kopieren
                  </button>
                </div>
              );
            })}
            {mitarbeiter.length === 0 && <p className="text-sm text-muted">Keine aktiven Mitarbeiter.</p>}
          </div>
        </div>
      )}

      <div className="mt-6 card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="sticky left-0 z-10 bg-surface px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-subtle">
                  Mitarbeiter
                </th>
                {tage.map((t) => (
                  <th key={iso(t)} className="min-w-[120px] px-2 py-3 text-center text-xs font-medium text-subtle">
                    {tagFmt.format(t)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {laden && (
                <tr><td colSpan={tage.length + 1} className="px-4 py-8 text-center text-muted">Wird geladen …</td></tr>
              )}
              {!laden && mitarbeiter.length === 0 && (
                <tr><td colSpan={tage.length + 1} className="px-4 py-8 text-center text-muted">
                  Noch keine aktiven Mitarbeiter. Bitte zuerst unter „Mitarbeiter“ anlegen.
                </td></tr>
              )}
              {!laden && mitarbeiter.map((m) => (
                <tr key={m.id} className="border-b border-line last:border-0">
                  <td className="sticky left-0 z-10 bg-surface px-4 py-3 align-top">
                    <span className="font-medium text-ink">{m.name}</span>
                    {m.rolle && <p className="text-xs text-subtle">{m.rolle}</p>}
                  </td>
                  {tage.map((t) => {
                    const datum = iso(t);
                    const list = schichtenFuer(m.id, datum);
                    return (
                      <td key={datum} className="px-1.5 py-1.5 align-top">
                        <div className="space-y-1">
                          {list.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => setEditing({ mitarbeiterId: m.id, datum, schicht: s })}
                              className="block w-full rounded-md border border-line-gold bg-[rgba(200,164,92,0.1)] px-2 py-1 text-left text-xs text-gold hover:bg-[rgba(200,164,92,0.18)]"
                            >
                              {s.vonZeit}–{s.bisZeit}
                              {s.notiz && <span className="block truncate text-[10px] text-muted">{s.notiz}</span>}
                            </button>
                          ))}
                          <button
                            onClick={() => setEditing({ mitarbeiterId: m.id, datum })}
                            className="block w-full rounded-md border border-dashed border-line py-1 text-xs text-subtle hover:border-line-gold hover:text-gold"
                            aria-label="Schicht hinzufügen"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <SchichtModal
          eintrag={editing}
          mitarbeiterName={mitarbeiter.find((m) => m.id === editing.mitarbeiterId)?.name ?? ""}
          onClose={() => setEditing(null)}
          onGespeichert={() => {
            setEditing(null);
            laden_();
          }}
        />
      )}
    </div>
  );
}

function SchichtModal({
  eintrag,
  mitarbeiterName,
  onClose,
  onGespeichert,
}: {
  eintrag: { mitarbeiterId: string; datum: string; schicht?: Schicht };
  mitarbeiterName: string;
  onClose: () => void;
  onGespeichert: () => void;
}) {
  const s = eintrag.schicht;
  const [vonZeit, setVonZeit] = useState(s?.vonZeit ?? "06:00");
  const [bisZeit, setBisZeit] = useState(s?.bisZeit ?? "14:00");
  const [notiz, setNotiz] = useState(s?.notiz ?? "");
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  const datumLabel = new Intl.DateTimeFormat("de-DE", { weekday: "long", day: "2-digit", month: "long" }).format(
    new Date(`${eintrag.datum}T12:00:00`)
  );

  async function speichern() {
    setBusy(true);
    setFehler(null);
    try {
      const res = await fetch("/api/admin/einsatzplan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s?.id, mitarbeiterId: eintrag.mitarbeiterId, datum: eintrag.datum, vonZeit, bisZeit, notiz: notiz.trim() }),
      });
      const d = await res.json();
      if (!res.ok) {
        setFehler(d.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      onGespeichert();
    } catch {
      setFehler("Speichern fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  }

  async function loeschen() {
    if (!s) return;
    setBusy(true);
    await fetch(`/api/admin/einsatzplan/${s.id}`, { method: "DELETE" });
    onGespeichert();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm card p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-lg font-semibold text-ink">{s ? "Schicht bearbeiten" : "Schicht hinzufügen"}</h2>
        <p className="mt-1 text-sm text-muted">{mitarbeiterName} · {datumLabel}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Von</span>
            <input type="time" value={vonZeit} onChange={(e) => setVonZeit(e.target.value)} className="field" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Bis</span>
            <input type="time" value={bisZeit} onChange={(e) => setBisZeit(e.target.value)} className="field" />
          </label>
        </div>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Notiz (optional)</span>
          <input value={notiz} onChange={(e) => setNotiz(e.target.value)} className="field" placeholder="z. B. Terminal 2, Springer" />
        </label>

        {fehler && <p className="mt-3 text-sm text-[var(--danger)]">{fehler}</p>}

        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-3">
            <button onClick={speichern} disabled={busy} className="btn-gold">{busy ? "…" : "Speichern"}</button>
            <button onClick={onClose} className="text-sm text-muted hover:text-ink">Abbrechen</button>
          </div>
          {s && (
            <button onClick={loeschen} disabled={busy} className="text-sm text-muted hover:text-[var(--danger)]">Löschen</button>
          )}
        </div>
      </div>
    </div>
  );
}
