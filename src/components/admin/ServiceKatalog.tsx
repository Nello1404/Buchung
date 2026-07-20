"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Typ = "FESTPREIS" | "ANFRAGE";

interface VehicleClass {
  id: string;
  code: string;
  name: string;
}
interface Preis {
  vehicleClassId: string;
  preisCent: number;
}
interface Service {
  id: string;
  code: string;
  name: string;
  kategorie: string;
  beschreibung: string | null;
  typ: Typ;
  sortOrder: number;
  active: boolean;
  preise: Preis[];
}

interface FormState {
  id?: string;
  code: string;
  name: string;
  kategorie: string;
  beschreibung: string;
  typ: Typ;
  sortOrder: string;
  active: boolean;
  preise: Record<string, string>; // vehicleClassId -> Euro-String
}

function centZuEuroStr(cent: number): string {
  return (cent / 100).toFixed(2).replace(".", ",");
}
function euroStrZuCent(s: string): number {
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function leererForm(): FormState {
  return {
    code: "",
    name: "",
    kategorie: "",
    beschreibung: "",
    typ: "FESTPREIS",
    sortOrder: "0",
    active: true,
    preise: {},
  };
}

function serviceZuForm(s: Service): FormState {
  const preise: Record<string, string> = {};
  for (const p of s.preise) preise[p.vehicleClassId] = centZuEuroStr(p.preisCent);
  return {
    id: s.id,
    code: s.code,
    name: s.name,
    kategorie: s.kategorie,
    beschreibung: s.beschreibung ?? "",
    typ: s.typ,
    sortOrder: String(s.sortOrder),
    active: s.active,
    preise,
  };
}

export function ServiceKatalog({
  services,
  vehicleClasses,
}: {
  services: Service[];
  vehicleClasses: VehicleClass[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function speichern(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setLoading(true);
    setFehler(null);
    try {
      const preise =
        form.typ === "FESTPREIS"
          ? vehicleClasses
              .map((vc) => ({ vehicleClassId: vc.id, preisCent: euroStrZuCent(form.preise[vc.id] ?? "0") }))
              .filter((p) => p.preisCent > 0)
          : [];
      const res = await fetch("/api/admin/service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          code: form.code.trim(),
          name: form.name.trim(),
          kategorie: form.kategorie.trim(),
          beschreibung: form.beschreibung.trim() || null,
          typ: form.typ,
          sortOrder: Number(form.sortOrder) || 0,
          active: form.active,
          preise,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setFehler(d.error ?? "Speichern fehlgeschlagen.");
      } else {
        setForm(null);
        router.refresh();
      }
    } catch {
      setFehler("Speichern fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  async function loeschen(s: Service) {
    if (!confirm(`Leistung „${s.name}“ wirklich löschen?`)) return;
    await fetch(`/api/admin/service/${s.id}`, { method: "DELETE" });
    router.refresh();
  }

  // Nach Kategorie gruppieren.
  const gruppen = new Map<string, Service[]>();
  for (const s of services) {
    const arr = gruppen.get(s.kategorie) ?? [];
    arr.push(s);
    gruppen.set(s.kategorie, arr);
  }

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button onClick={() => { setForm(leererForm()); setFehler(null); }} className="btn-gold">
          + Neue Leistung
        </button>
        <span className="text-sm text-subtle">{services.length} Leistung(en) im Katalog</span>
      </div>

      {form && (
        <form onSubmit={speichern} className="mt-6 card p-5">
          <h2 className="font-serif text-lg font-semibold text-ink">
            {form.id ? "Leistung bearbeiten" : "Neue Leistung"}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Kürzel (intern, eindeutig)</span>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="z. B. politur" className="field" required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Kategorie</span>
              <input value={form.kategorie} onChange={(e) => setForm({ ...form, kategorie: e.target.value })} placeholder="z. B. Reinigung" className="field" required list="kategorien" />
              <datalist id="kategorien">
                {[...new Set(services.map((s) => s.kategorie))].map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Abrechnungsart</span>
              <select value={form.typ} onChange={(e) => setForm({ ...form, typ: e.target.value as Typ })} className="field">
                <option value="FESTPREIS">Festpreis (online buchbar)</option>
                <option value="ANFRAGE">Auf Anfrage (Angebot)</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-ink">Beschreibung (optional)</span>
              <textarea value={form.beschreibung} onChange={(e) => setForm({ ...form, beschreibung: e.target.value })} rows={2} className="field" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Reihenfolge</span>
              <input value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} inputMode="numeric" className="field w-24" />
            </label>
            <label className="flex items-center gap-2 self-end pb-2">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <span className="text-sm text-ink">Aktiv (auf der Website sichtbar)</span>
            </label>
          </div>

          {form.typ === "FESTPREIS" && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-ink">Preise je Fahrzeugklasse (€)</p>
              <div className="flex flex-wrap gap-3">
                {vehicleClasses.map((vc) => (
                  <label key={vc.id} className="block">
                    <span className="mb-1.5 block text-xs text-subtle">{vc.name}</span>
                    <input
                      value={form.preise[vc.id] ?? ""}
                      onChange={(e) => setForm({ ...form, preise: { ...form.preise, [vc.id]: e.target.value } })}
                      inputMode="decimal"
                      placeholder="0,00"
                      className="field w-28"
                    />
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-subtle">Leere Felder werden nicht angezeigt.</p>
            </div>
          )}

          {fehler && <p className="mt-3 text-sm text-[var(--danger)]">{fehler}</p>}
          <div className="mt-4 flex gap-3">
            <button type="submit" disabled={loading} className="btn-gold">
              {loading ? "Speichern…" : "Speichern"}
            </button>
            <button type="button" onClick={() => setForm(null)} className="text-sm text-muted hover:text-ink">
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 space-y-8">
        {[...gruppen.entries()].map(([kategorie, list]) => (
          <div key={kategorie}>
            <h2 className="font-serif text-lg font-semibold text-gold">{kategorie}</h2>
            <div className="mt-3 card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-subtle">
                      <th className="px-5 py-3 font-medium">Leistung</th>
                      <th className="px-5 py-3 font-medium">Art</th>
                      <th className="px-5 py-3 font-medium">Preise</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((s) => (
                      <tr key={s.id} className="border-b border-line last:border-0">
                        <td className="px-5 py-3">
                          <span className="text-ink">{s.name}</span>
                          {s.beschreibung && <p className="mt-0.5 text-xs text-subtle">{s.beschreibung}</p>}
                        </td>
                        <td className="px-5 py-3 text-muted">{s.typ === "FESTPREIS" ? "Festpreis" : "Auf Anfrage"}</td>
                        <td className="px-5 py-3 text-muted">
                          {s.typ === "FESTPREIS"
                            ? s.preise.length
                              ? s.preise
                                  .map((p) => centZuEuroStr(p.preisCent) + " €")
                                  .join(" / ")
                              : "—"
                            : "individuell"}
                        </td>
                        <td className="px-5 py-3">
                          {s.active ? (
                            <span className="text-[var(--success)]">Aktiv</span>
                          ) : (
                            <span className="text-subtle">Inaktiv</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <button onClick={() => { setForm(serviceZuForm(s)); setFehler(null); }} className="text-sm text-gold hover:underline">
                            Bearbeiten
                          </button>
                          <button onClick={() => loeschen(s)} className="ml-4 text-sm text-muted hover:text-[var(--danger)]">
                            Löschen
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
        {services.length === 0 && <p className="text-muted">Noch keine Leistungen angelegt.</p>}
      </div>
    </div>
  );
}
