"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { centZuEUR } from "@/lib/format";
import type { berechneUmsatz } from "@/lib/revenue";

type Umsatz = Awaited<ReturnType<typeof berechneUmsatz>>;
type Preset = "tag" | "woche" | "monat" | "jahr" | "custom";

const presets: { key: Preset; label: string }[] = [
  { key: "tag", label: "Heute" },
  { key: "woche", label: "Woche" },
  { key: "monat", label: "Monat" },
  { key: "jahr", label: "Jahr" },
  { key: "custom", label: "Frei" },
];

function delta(aktuell: number, vergleich: number): { text: string; farbe: string } {
  if (vergleich === 0) return { text: "–", farbe: "text-subtle" };
  const p = Math.round(((aktuell - vergleich) / vergleich) * 100);
  if (p > 0) return { text: `+${p}%`, farbe: "text-[var(--success)]" };
  if (p < 0) return { text: `${p}%`, farbe: "text-[var(--danger)]" };
  return { text: "±0%", farbe: "text-subtle" };
}

export function UmsatzDashboard({ initial }: { initial: Umsatz }) {
  const [data, setData] = useState<Umsatz>(initial);
  const [preset, setPreset] = useState<Preset>("monat");
  const [von, setVon] = useState("");
  const [bis, setBis] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportLaeuft, setReportLaeuft] = useState(false);

  async function sendeReport() {
    setReportLaeuft(true);
    try {
      const res = await fetch("/api/cron/wochenreport", { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        alert(`Wochenreport (${d.zeitraum}) an ${d.an} gesendet.`);
      } else {
        alert(d.error ?? "Report konnte nicht gesendet werden.");
      }
    } finally {
      setReportLaeuft(false);
    }
  }

  const laden = useCallback(async (p: Preset, v?: string, b?: string) => {
    setLoading(true);
    const qs = new URLSearchParams({ preset: p });
    if (p === "custom" && v && b) {
      qs.set("von", v);
      qs.set("bis", b);
    }
    try {
      const res = await fetch(`/api/cockpit/umsatz?${qs.toString()}`, { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  function waehle(p: Preset) {
    setPreset(p);
    if (p !== "custom") laden(p);
  }

  const csvUrl = () => {
    const qs = new URLSearchParams({ preset });
    if (preset === "custom" && von && bis) {
      qs.set("von", von);
      qs.set("bis", bis);
    }
    return `/api/cockpit/umsatz/csv?${qs.toString()}`;
  };

  const maxQuelle = Math.max(1, ...data.quellen.map((q) => Math.abs(q.betragCent)));
  const maxVerlauf = Math.max(1, ...data.zeitreihe.map((z) => z.betragCent));
  const maxVergleich = Math.max(
    1,
    data.bruttoCent,
    data.vergleich.vorzeitraumBruttoCent,
    data.vergleich.vorjahrBruttoCent
  );

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-ink">Umsatz</h1>
            <p className="text-xs text-subtle">
              Stichtag: Zahlungsdatum · {loading ? "lädt…" : `${data.von.slice(0, 10)} bis ${new Date(new Date(data.bis).getTime() - 1).toISOString().slice(0, 10)}`}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin" className="btn-outline !px-4 !py-2 text-sm">← Übersicht</Link>
            <button onClick={sendeReport} disabled={reportLaeuft} className="btn-outline !px-4 !py-2 text-sm">
              {reportLaeuft ? "Sende…" : "Wochenreport senden"}
            </button>
            <a href={csvUrl()} className="btn-gold !px-4 !py-2 text-sm">CSV-Export</a>
          </div>
        </div>

        {/* Zeitraumwähler */}
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div className="flex gap-2">
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => waehle(p.key)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  preset === p.key ? "border-line-gold text-gold" : "border-line text-muted hover:text-ink"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {preset === "custom" && (
            <div className="flex items-end gap-2">
              <input type="date" value={von} onChange={(e) => setVon(e.target.value)} className="field !py-1.5" />
              <input type="date" value={bis} onChange={(e) => setBis(e.target.value)} className="field !py-1.5" />
              <button onClick={() => von && bis && laden("custom", von, bis)} className="btn-outline !px-4 !py-2 text-sm">Anzeigen</button>
            </div>
          )}
        </div>

        {/* KPI-Kacheln */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kachel label="Brutto-Umsatz" wert={centZuEUR(data.bruttoCent)} gross />
          <Kachel label="Netto (nach Storno)" wert={centZuEUR(data.nettoNachStornoCent)} hinweis={`abzgl. ${centZuEUR(data.erstattetCent)} Erstattung`} />
          <Kachel label="Netto (ohne USt)" wert={centZuEUR(data.ustAusweis.nettoCent)} hinweis={`zzgl. ${centZuEUR(data.ustAusweis.ustCent)} USt`} />
          <Kachel label="Stornoquote" wert={`${data.kennzahlen.stornoquoteProzent}%`} hinweis={`${data.kennzahlen.stornierteAnzahl} von ${data.kennzahlen.anzahlBuchungen}`} />
          <Kachel label="Ø Erlös / Fahrzeug-Tag" wert={centZuEUR(data.kennzahlen.oErloesProFahrzeugTagCent)} />
          <Kachel label="Ø Buchungsdauer" wert={`${data.kennzahlen.oBuchungsdauerTage} Tage`} />
          <Kachel label="Ø Zusatzservice-Warenkorb" wert={centZuEUR(data.kennzahlen.oAddonWarenkorbCent)} />
          <Kachel label="Buchungen (bezahlt)" wert={String(data.kennzahlen.anzahlBuchungen)} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Umsatz nach Quelle */}
          <ChartKarte titel="Umsatz nach Quelle">
            {data.quellen.length === 0 ? (
              <Leer />
            ) : (
              <ul className="space-y-3">
                {data.quellen.map((q) => (
                  <li key={q.quelle}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted">{q.quelle}</span>
                      <span className="text-ink">{centZuEUR(q.betragCent)}</span>
                    </div>
                    <Balken anteil={Math.abs(q.betragCent) / maxQuelle} negativ={q.betragCent < 0} />
                  </li>
                ))}
              </ul>
            )}
          </ChartKarte>

          {/* Vergleich */}
          <ChartKarte titel="Vergleich">
            <ul className="space-y-4">
              <VergleichZeile label="Aktueller Zeitraum" wert={data.bruttoCent} max={maxVergleich} />
              <VergleichZeile
                label="Vorzeitraum"
                wert={data.vergleich.vorzeitraumBruttoCent}
                max={maxVergleich}
                badge={delta(data.bruttoCent, data.vergleich.vorzeitraumBruttoCent)}
              />
              <VergleichZeile
                label="Vorjahr"
                wert={data.vergleich.vorjahrBruttoCent}
                max={maxVergleich}
                badge={delta(data.bruttoCent, data.vergleich.vorjahrBruttoCent)}
              />
            </ul>
          </ChartKarte>
        </div>

        {/* Verlauf */}
        <div className="mt-6">
          <ChartKarte titel="Umsatzverlauf">
            {data.zeitreihe.length === 0 ? (
              <Leer />
            ) : (
              <div className="flex items-end gap-1.5 overflow-x-auto pb-2" style={{ height: 180 }}>
                {data.zeitreihe.map((z) => (
                  <div key={z.bucket} className="flex min-w-[24px] flex-1 flex-col items-center justify-end gap-1" title={`${z.bucket}: ${centZuEUR(z.betragCent)}`}>
                    <div
                      className="w-full rounded-t-[4px] bg-[var(--gold)]"
                      style={{ height: `${Math.max(2, (z.betragCent / maxVerlauf) * 150)}px` }}
                    />
                    <span className="text-[9px] text-subtle">{z.bucket.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </ChartKarte>
        </div>

        <p className="mt-8 text-center text-xs text-subtle">
          Betriebsübersicht — ersetzt nicht die Buchhaltung des Steuerberaters. Alle Beträge inkl. Ausweis 19 % USt.
        </p>
      </div>
    </div>
  );
}

function Kachel({ label, wert, hinweis, gross }: { label: string; wert: string; hinweis?: string; gross?: boolean }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-subtle">{label}</div>
      <div className={`mt-1.5 font-serif font-semibold text-ink ${gross ? "text-2xl text-gold" : "text-xl"}`}>{wert}</div>
      {hinweis && <div className="mt-0.5 text-[11px] text-subtle">{hinweis}</div>}
    </div>
  );
}

function ChartKarte({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="mb-4 font-medium text-ink">{titel}</h2>
      {children}
    </div>
  );
}

function Balken({ anteil, negativ }: { anteil: number; negativ?: boolean }) {
  return (
    <div className="h-2 w-full rounded-full bg-[var(--bg-elev-2)]">
      <div
        className={`h-2 rounded-full ${negativ ? "bg-[var(--danger)]" : "bg-[var(--gold)]"}`}
        style={{ width: `${Math.max(2, anteil * 100)}%` }}
      />
    </div>
  );
}

function VergleichZeile({ label, wert, max, badge }: { label: string; wert: number; max: number; badge?: { text: string; farbe: string } }) {
  return (
    <li>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="flex items-center gap-2">
          <span className="text-ink">{centZuEUR(wert)}</span>
          {badge && <span className={`text-xs ${badge.farbe}`}>{badge.text}</span>}
        </span>
      </div>
      <Balken anteil={wert / max} />
    </li>
  );
}

function Leer() {
  return <p className="text-sm text-subtle">Keine Umsätze im Zeitraum.</p>;
}
