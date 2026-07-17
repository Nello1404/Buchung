"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { centZuEUR } from "@/lib/format";

interface Uebersicht {
  jahr: number;
  monat: number;
  einnahmenBruttoCent: number;
  erstattetCent: number;
  einnahmenCent: number;
  ausgabenCent: number;
  ergebnisCent: number;
  ruecklageProzent: number;
  ruecklageCent: number;
  kategorien: { name: string; betragCent: number }[];
}
interface FinanzData {
  uebersicht: Uebersicht;
  liquiditaet: { bucket: string; monatCent: number; kumuliertCent: number }[];
  ausgaben: { id: string; datum: string; betragCent: number; kategorie: string; notiz: string | null; automatisch: boolean }[];
  kategorien: { id: string; name: string }[];
  wiederkehrend: { id: string; name: string; betragCent: number; kategorie: string; startDatum: string }[];
  audit: { email: string; aktion: string; entity: string; zeit: string }[];
}

const monatsnamen = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const heuteISO = () => new Date().toISOString().slice(0, 10);

export function FinanzDashboard({ initial }: { initial: FinanzData }) {
  const [data, setData] = useState<FinanzData>(initial);
  const [loading, setLoading] = useState(false);
  const u = data.uebersicht;

  const lade = useCallback(async (jahr: number, monat: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cockpit/finanzen?jahr=${jahr}&monat=${monat}`, { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  function monatWechseln(delta: number) {
    let m = u.monat + delta;
    let j = u.jahr;
    if (m < 1) { m = 12; j--; }
    if (m > 12) { m = 1; j++; }
    lade(j, m);
  }

  const maxKat = Math.max(1, ...u.kategorien.map((k) => k.betragCent));
  const csvUrl = `/api/cockpit/finanzen/csv?jahr=${u.jahr}&monat=${u.monat}`;

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-ink">Einnahmen &amp; Ausgaben</h1>
            <p className="text-xs text-subtle">Betriebsübersicht — ersetzt nicht die Buchhaltung des Steuerberaters.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/cockpit" className="btn-outline !px-4 !py-2 text-sm">← Cockpit</Link>
            <a href={csvUrl} className="btn-gold !px-4 !py-2 text-sm">CSV-Export</a>
          </div>
        </div>

        {/* Monatswähler */}
        <div className="mt-5 flex items-center gap-4">
          <button onClick={() => monatWechseln(-1)} className="btn-outline !px-3 !py-1.5 text-sm">←</button>
          <span className="min-w-[160px] text-center font-medium text-ink">{monatsnamen[u.monat - 1]} {u.jahr}</span>
          <button onClick={() => monatWechseln(1)} className="btn-outline !px-3 !py-1.5 text-sm">→</button>
          {loading && <span className="text-xs text-subtle">lädt…</span>}
        </div>

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kachel label="Einnahmen (nach Storno)" wert={centZuEUR(u.einnahmenCent)} />
          <Kachel label="Ausgaben" wert={centZuEUR(u.ausgabenCent)} />
          <Kachel label="Ergebnis" wert={centZuEUR(u.ergebnisCent)} akzent={u.ergebnisCent} />
          <RuecklageKachel uebersicht={u} onUpdate={() => lade(u.jahr, u.monat)} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Ausgaben nach Kategorie */}
          <div className="card p-5">
            <h2 className="mb-4 font-medium text-ink">Ausgaben nach Kategorie</h2>
            {u.kategorien.length === 0 ? (
              <p className="text-sm text-subtle">Keine Ausgaben in diesem Monat.</p>
            ) : (
              <ul className="space-y-3">
                {u.kategorien.map((k) => (
                  <li key={k.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-muted">{k.name}</span>
                      <span className="text-ink">{centZuEUR(k.betragCent)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[var(--bg-elev-2)]">
                      <div className="h-2 rounded-full bg-[var(--gold)]" style={{ width: `${Math.max(2, (k.betragCent / maxKat) * 100)}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Liquiditätsverlauf */}
          <div className="card p-5">
            <h2 className="mb-4 font-medium text-ink">Liquiditätsverlauf (12 Monate, kumuliert)</h2>
            <LiquiditaetChart punkte={data.liquiditaet} />
          </div>
        </div>

        {/* Ausgabe erfassen + Liste */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AusgabeErfassen kategorien={data.kategorien} onGespeichert={() => lade(u.jahr, u.monat)} />
            <div className="mt-4 card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-subtle">
                      <th className="px-4 py-3 font-medium">Datum</th>
                      <th className="px-4 py-3 font-medium">Kategorie</th>
                      <th className="px-4 py-3 font-medium">Betrag</th>
                      <th className="px-4 py-3 font-medium">Notiz</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ausgaben.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-muted">Keine Ausgaben erfasst.</td></tr>
                    )}
                    {data.ausgaben.map((a) => (
                      <tr key={a.id} className="border-b border-line last:border-0">
                        <td className="px-4 py-2.5 text-muted">{a.datum}</td>
                        <td className="px-4 py-2.5 text-ink">{a.kategorie}</td>
                        <td className="px-4 py-2.5 text-ink">{centZuEUR(a.betragCent)}</td>
                        <td className="px-4 py-2.5 text-subtle">{a.notiz ?? ""}{a.automatisch ? " · auto" : ""}</td>
                        <td className="px-4 py-2.5 text-right">
                          {!a.automatisch && <LoeschButton id={a.id} onDone={() => lade(u.jahr, u.monat)} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Seitenspalte: wiederkehrend, Kategorien, Audit */}
          <div className="space-y-6">
            <WiederkehrendVerwalten
              kategorien={data.kategorien}
              eintraege={data.wiederkehrend}
              onChange={() => lade(u.jahr, u.monat)}
            />
            <KategorieVerwalten onChange={() => lade(u.jahr, u.monat)} />
            <div className="card p-5">
              <h3 className="mb-3 font-medium text-ink">Änderungsprotokoll</h3>
              <ul className="space-y-1.5 text-xs text-muted">
                {data.audit.length === 0 && <li className="text-subtle">Noch keine Änderungen.</li>}
                {data.audit.map((a, i) => (
                  <li key={i}>
                    <span className="text-subtle">{new Date(a.zeit).toLocaleString("de-DE", { timeZone: "Europe/Berlin", dateStyle: "short", timeStyle: "short" })}</span>{" "}
                    · {a.aktion} · {a.email}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kachel({ label, wert, akzent }: { label: string; wert: string; akzent?: number }) {
  const farbe = akzent === undefined ? "text-ink" : akzent >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]";
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-subtle">{label}</div>
      <div className={`mt-1.5 font-serif text-xl font-semibold ${farbe}`}>{wert}</div>
    </div>
  );
}

function RuecklageKachel({ uebersicht, onUpdate }: { uebersicht: Uebersicht; onUpdate: () => void }) {
  const [prozent, setProzent] = useState(String(uebersicht.ruecklageProzent));
  const [bearbeiten, setBearbeiten] = useState(false);

  async function speichern() {
    const p = Number(prozent);
    if (!Number.isInteger(p) || p < 0 || p > 100) return;
    await fetch("/api/cockpit/einstellungen", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steuerRuecklageProzent: p }),
    });
    setBearbeiten(false);
    onUpdate();
  }

  return (
    <div className="card border-line-gold p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-gold">Steuer-Rücklage</span>
        <button onClick={() => setBearbeiten((b) => !b)} className="text-xs text-subtle hover:text-ink">{uebersicht.ruecklageProzent}%</button>
      </div>
      <div className="mt-1.5 font-serif text-xl font-semibold text-gold">{centZuEUR(uebersicht.ruecklageCent)}</div>
      <div className="mt-0.5 text-[11px] text-subtle">empfohlen vom Ergebnis</div>
      {bearbeiten && (
        <div className="mt-2 flex items-center gap-1">
          <input value={prozent} onChange={(e) => setProzent(e.target.value)} inputMode="numeric" className="field w-16 !py-1 text-sm" />
          <span className="text-xs text-subtle">%</span>
          <button onClick={speichern} className="ml-1 rounded-full border border-line-gold px-2 py-1 text-xs text-gold">OK</button>
        </div>
      )}
    </div>
  );
}

function LiquiditaetChart({ punkte }: { punkte: { bucket: string; kumuliertCent: number }[] }) {
  if (punkte.length === 0) return <p className="text-sm text-subtle">Keine Daten.</p>;
  const werte = punkte.map((p) => p.kumuliertCent);
  const min = Math.min(0, ...werte);
  const max = Math.max(1, ...werte);
  const spanne = max - min || 1;
  const W = 100, H = 40;
  const punkteStr = punkte
    .map((p, i) => {
      const x = punkte.length > 1 ? (i / (punkte.length - 1)) * W : 0;
      const y = H - ((p.kumuliertCent - min) / spanne) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const nulllinieY = H - ((0 - min) / spanne) * H;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-40 w-full">
        <line x1="0" y1={nulllinieY} x2={W} y2={nulllinieY} stroke="var(--border)" strokeWidth="0.4" />
        <polyline points={punkteStr} fill="none" stroke="var(--gold)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-subtle">
        <span>{punkte[0].bucket}</span>
        <span>aktuell: {centZuEUR(punkte[punkte.length - 1].kumuliertCent)}</span>
        <span>{punkte[punkte.length - 1].bucket}</span>
      </div>
    </div>
  );
}

function AusgabeErfassen({ kategorien, onGespeichert }: { kategorien: { id: string; name: string }[]; onGespeichert: () => void }) {
  const [datum, setDatum] = useState(heuteISO());
  const [betrag, setBetrag] = useState("");
  const [categoryId, setCategoryId] = useState(kategorien[0]?.id ?? "");
  const [notiz, setNotiz] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function speichern(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    const b = Number(betrag.replace(",", "."));
    if (!(b > 0)) { setFehler("Bitte einen gültigen Betrag eingeben."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/cockpit/ausgaben", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datum, betrag: b, categoryId, notiz: notiz.trim() || undefined }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setFehler(d.error ?? "Fehlgeschlagen."); return; }
      setBetrag(""); setNotiz("");
      onGespeichert();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={speichern} className="card flex flex-wrap items-end gap-3 p-5">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Datum</span>
        <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Betrag (brutto)</span>
        <input value={betrag} onChange={(e) => setBetrag(e.target.value)} inputMode="decimal" placeholder="z. B. 89,90" className="field w-32" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Kategorie</span>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field">
          {kategorien.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
      </label>
      <label className="block flex-1 min-w-[150px]">
        <span className="mb-1.5 block text-sm font-medium text-ink">Notiz (optional)</span>
        <input value={notiz} onChange={(e) => setNotiz(e.target.value)} className="field" />
      </label>
      <button type="submit" disabled={loading} className="btn-gold">{loading ? "…" : "Ausgabe erfassen"}</button>
      {fehler && <span className="w-full text-sm text-[var(--danger)]">{fehler}</span>}
    </form>
  );
}

function LoeschButton({ id, onDone }: { id: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => { setBusy(true); await fetch(`/api/cockpit/ausgaben/${id}`, { method: "DELETE" }); onDone(); }}
      disabled={busy}
      className="text-xs text-muted hover:text-[var(--danger)]"
    >
      löschen
    </button>
  );
}

function WiederkehrendVerwalten({
  kategorien,
  eintraege,
  onChange,
}: {
  kategorien: { id: string; name: string }[];
  eintraege: { id: string; name: string; betragCent: number; kategorie: string; startDatum: string }[];
  onChange: () => void;
}) {
  const [offen, setOffen] = useState(false);
  const [name, setName] = useState("");
  const [betrag, setBetrag] = useState("");
  const [categoryId, setCategoryId] = useState(kategorien[0]?.id ?? "");
  const [startDatum, setStartDatum] = useState(heuteISO().slice(0, 8) + "01");

  async function anlegen(e: React.FormEvent) {
    e.preventDefault();
    const b = Number(betrag.replace(",", "."));
    if (!(b > 0) || !name.trim()) return;
    await fetch("/api/cockpit/wiederkehrend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), betrag: b, categoryId, startDatum }),
    });
    setName(""); setBetrag(""); setOffen(false);
    onChange();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-ink">Wiederkehrend (monatlich)</h3>
        <button onClick={() => setOffen((o) => !o)} className="text-sm text-gold">+ Neu</button>
      </div>
      {offen && (
        <form onSubmit={anlegen} className="mt-3 space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bezeichnung (z. B. Miete)" className="field text-sm" />
          <div className="flex gap-2">
            <input value={betrag} onChange={(e) => setBetrag(e.target.value)} inputMode="decimal" placeholder="Betrag" className="field w-24 text-sm" />
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field text-sm">
              {kategorien.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
          </div>
          <input type="date" value={startDatum} onChange={(e) => setStartDatum(e.target.value)} className="field text-sm" />
          <button type="submit" className="btn-gold w-full !py-2 text-sm">Anlegen</button>
        </form>
      )}
      <ul className="mt-3 space-y-2 text-sm">
        {eintraege.length === 0 && <li className="text-subtle">Keine.</li>}
        {eintraege.map((w) => (
          <li key={w.id} className="flex items-center justify-between gap-2">
            <span className="text-muted">{w.name} · {centZuEUR(w.betragCent)}</span>
            <button
              onClick={async () => { await fetch(`/api/cockpit/wiederkehrend/${w.id}`, { method: "DELETE" }); onChange(); }}
              className="text-xs text-muted hover:text-[var(--danger)]"
            >
              beenden
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KategorieVerwalten({ onChange }: { onChange: () => void }) {
  const [name, setName] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);

  async function anlegen(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    if (name.trim().length < 2) return;
    const res = await fetch("/api/cockpit/kategorien", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); setFehler(d.error ?? "Fehlgeschlagen."); return; }
    setName("");
    onChange();
  }

  return (
    <div className="card p-5">
      <h3 className="mb-3 font-medium text-ink">Kategorie hinzufügen</h3>
      <form onSubmit={anlegen} className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="field text-sm" />
        <button type="submit" className="btn-outline !px-3 !py-2 text-sm">+</button>
      </form>
      {fehler && <p className="mt-2 text-xs text-[var(--danger)]">{fehler}</p>}
    </div>
  );
}
