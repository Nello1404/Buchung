"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { centZuEUR } from "@/lib/format";
import type { PlanIst, Ampel } from "@/lib/plan";

const monatsnamen = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const ampelDot: Record<Ampel, string> = {
  gruen: "bg-[#3f7d52]",
  gelb: "bg-[#b7902f]",
  rot: "bg-[#b0463c]",
  neutral: "bg-[var(--bg-elev-2)]",
};

interface Kategorie { id: string; name: string; budgetCent: number | null }
interface Schwellen { warnAuslastungProzent: number; warnTagVollProzent: number; warnStornoquoteProzent: number }

export function PlanDashboard({ initial, kategorien: katInit, schwellen: schwInit }: { initial: PlanIst; kategorien: Kategorie[]; schwellen: Schwellen }) {
  const [pi, setPi] = useState<PlanIst>(initial);
  const [kategorien, setKategorien] = useState<Kategorie[]>(katInit);
  const [schwellen, setSchwellen] = useState<Schwellen>(schwInit);
  const [loading, setLoading] = useState(false);

  const lade = useCallback(async (jahr: number, monat: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cockpit/plan?jahr=${jahr}&monat=${monat}`, { cache: "no-store" });
      if (res.ok) setPi(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  function monatWechseln(delta: number) {
    let m = pi.monat + delta, j = pi.jahr;
    if (m < 1) { m = 12; j--; }
    if (m > 12) { m = 1; j++; }
    lade(j, m);
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-2xl font-semibold text-ink">Plan-Ist</h1>
          <Link href="/cockpit" className="btn-outline !px-4 !py-2 text-sm">← Cockpit</Link>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button onClick={() => monatWechseln(-1)} className="btn-outline !px-3 !py-1.5 text-sm">←</button>
          <span className="min-w-[160px] text-center font-medium text-ink">{monatsnamen[pi.monat - 1]} {pi.jahr}</span>
          <button onClick={() => monatWechseln(1)} className="btn-outline !px-3 !py-1.5 text-sm">→</button>
          {loading && <span className="text-xs text-subtle">lädt…</span>}
        </div>

        {/* Plan-Ist-Ampel */}
        <div className="mt-6 card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-subtle">
                <th className="px-5 py-3 font-medium">Kennzahl</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Ist</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <AmpelZeile label="Auslastung Valet" plan={`${pi.plan.auslastungValetProzent}%`} ist={`${pi.ist.auslastungValetProzent}%`} ampel={pi.ampeln.auslastungValet} />
              <AmpelZeile label="Auslastung Shuttle" plan={`${pi.plan.auslastungShuttleProzent}%`} ist={`${pi.ist.auslastungShuttleProzent}%`} ampel={pi.ampeln.auslastungShuttle} />
              <AmpelZeile label="Umsatz" plan={centZuEUR(pi.plan.umsatzCent)} ist={centZuEUR(pi.ist.umsatzCent)} ampel={pi.ampeln.umsatz} />
              <AmpelZeile label="Kosten" plan={centZuEUR(pi.plan.kostenCent)} ist={centZuEUR(pi.ist.kostenCent)} ampel={pi.ampeln.kosten} />
              <AmpelZeile label="Ergebnis" plan={centZuEUR(pi.plan.umsatzCent - pi.plan.kostenCent)} ist={centZuEUR(pi.ist.ergebnisCent)} ampel={pi.ampeln.ergebnis} />
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Planwerte pi={pi} onGespeichert={() => lade(pi.jahr, pi.monat)} />
          <Warnschwellen schwellen={schwellen} onChange={setSchwellen} />
        </div>

        <div className="mt-6">
          <KategorieBudgets kategorien={kategorien} onChange={setKategorien} />
        </div>
      </div>
    </div>
  );
}

function AmpelZeile({ label, plan, ist, ampel }: { label: string; plan: string; ist: string; ampel: Ampel }) {
  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-5 py-3 text-ink">{label}</td>
      <td className="px-5 py-3 text-muted">{plan}</td>
      <td className="px-5 py-3 text-ink">{ist}</td>
      <td className="px-5 py-3">
        <span className={`inline-block h-3 w-3 rounded-full ${ampelDot[ampel]}`} title={ampel} />
      </td>
    </tr>
  );
}

function Planwerte({ pi, onGespeichert }: { pi: PlanIst; onGespeichert: () => void }) {
  const [valet, setValet] = useState(String(pi.plan.auslastungValetProzent));
  const [shuttle, setShuttle] = useState(String(pi.plan.auslastungShuttleProzent));
  const [umsatz, setUmsatz] = useState((pi.plan.umsatzCent / 100).toFixed(0));
  const [kosten, setKosten] = useState((pi.plan.kostenCent / 100).toFixed(0));
  const [meldung, setMeldung] = useState<string | null>(null);

  async function speichern(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/cockpit/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jahr: pi.jahr, monat: pi.monat,
        auslastungValetProzent: Number(valet) || 0,
        auslastungShuttleProzent: Number(shuttle) || 0,
        umsatz: Number(umsatz.replace(",", ".")) || 0,
        kosten: Number(kosten.replace(",", ".")) || 0,
      }),
    });
    if (res.ok) { setMeldung("Gespeichert ✓"); onGespeichert(); setTimeout(() => setMeldung(null), 2000); }
  }

  return (
    <form onSubmit={speichern} className="card space-y-3 p-5">
      <h2 className="font-medium text-ink">Planwerte {monatsnamen[pi.monat - 1]} {pi.jahr}</h2>
      <p className="text-xs text-subtle">Aus der Kalkulations-Excel eintragen.</p>
      <div className="grid grid-cols-2 gap-3">
        <Feld label="Auslastung Valet (%)"><input value={valet} onChange={(e) => setValet(e.target.value)} inputMode="numeric" className="field" /></Feld>
        <Feld label="Auslastung Shuttle (%)"><input value={shuttle} onChange={(e) => setShuttle(e.target.value)} inputMode="numeric" className="field" /></Feld>
        <Feld label="Umsatz (€)"><input value={umsatz} onChange={(e) => setUmsatz(e.target.value)} inputMode="decimal" className="field" /></Feld>
        <Feld label="Kosten (€)"><input value={kosten} onChange={(e) => setKosten(e.target.value)} inputMode="decimal" className="field" /></Feld>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-gold !py-2 text-sm">Planwerte speichern</button>
        {meldung && <span className="text-sm text-[var(--success)]">{meldung}</span>}
      </div>
    </form>
  );
}

function Warnschwellen({ schwellen, onChange }: { schwellen: Schwellen; onChange: (s: Schwellen) => void }) {
  const [a, setA] = useState(String(schwellen.warnAuslastungProzent));
  const [t, setT] = useState(String(schwellen.warnTagVollProzent));
  const [s, setS] = useState(String(schwellen.warnStornoquoteProzent));
  const [meldung, setMeldung] = useState<string | null>(null);

  async function speichern(e: React.FormEvent) {
    e.preventDefault();
    const body = { warnAuslastungProzent: Number(a) || 0, warnTagVollProzent: Number(t) || 0, warnStornoquoteProzent: Number(s) || 0 };
    const res = await fetch("/api/cockpit/warn-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { onChange(body); setMeldung("Gespeichert ✓"); setTimeout(() => setMeldung(null), 2000); }
  }

  return (
    <form onSubmit={speichern} className="card space-y-3 p-5">
      <h2 className="font-medium text-ink">Frühwarn-Schwellen</h2>
      <p className="text-xs text-subtle">Warnungen erscheinen als Banner im Cockpit.</p>
      <Feld label="Auslastung nächste 14 Tage unter (%)"><input value={a} onChange={(e) => setA(e.target.value)} inputMode="numeric" className="field" /></Feld>
      <Feld label="Tag voll ab (%) – Preis-Chance"><input value={t} onChange={(e) => setT(e.target.value)} inputMode="numeric" className="field" /></Feld>
      <Feld label="Stornoquote über (%)"><input value={s} onChange={(e) => setS(e.target.value)} inputMode="numeric" className="field" /></Feld>
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-gold !py-2 text-sm">Schwellen speichern</button>
        {meldung && <span className="text-sm text-[var(--success)]">{meldung}</span>}
      </div>
    </form>
  );
}

function KategorieBudgets({ kategorien, onChange }: { kategorien: Kategorie[]; onChange: (k: Kategorie[]) => void }) {
  const [werte, setWerte] = useState<Record<string, string>>(
    () => Object.fromEntries(kategorien.map((k) => [k.id, k.budgetCent != null ? (k.budgetCent / 100).toFixed(0) : ""]))
  );
  const [meldung, setMeldung] = useState<string | null>(null);

  async function speichern(id: string) {
    const v = werte[id];
    const budget = v.trim() === "" ? null : Number(v.replace(",", "."));
    await fetch("/api/cockpit/kategorie-budget", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: id, budget }),
    });
    onChange(kategorien.map((k) => (k.id === id ? { ...k, budgetCent: budget === null ? null : Math.round(budget * 100) } : k)));
    setMeldung(id);
    setTimeout(() => setMeldung(null), 1500);
  }

  return (
    <div className="card p-5">
      <h2 className="mb-1 font-medium text-ink">Monatsbudgets je Kategorie</h2>
      <p className="mb-4 text-xs text-subtle">Leer lassen = kein Budget. Überschreitung löst eine Warnung aus.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {kategorien.map((k) => (
          <div key={k.id} className="flex items-center gap-2">
            <span className="flex-1 text-sm text-muted">{k.name}</span>
            <input
              value={werte[k.id] ?? ""}
              onChange={(e) => setWerte((p) => ({ ...p, [k.id]: e.target.value }))}
              inputMode="decimal"
              placeholder="€/Monat"
              className="field w-28 !py-1.5 text-sm"
            />
            <button onClick={() => speichern(k.id)} className="rounded-full border border-line-gold px-3 py-1.5 text-xs text-gold">
              {meldung === k.id ? "✓" : "OK"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Feld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
