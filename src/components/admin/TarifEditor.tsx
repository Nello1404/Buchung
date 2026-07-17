"use client";

import { useState } from "react";

interface Daten {
  products: { id: string; code: string; name: string }[];
  vehicleClasses: { id: string; code: string; name: string }[];
  tariffRules: {
    id: string;
    productId: string;
    vehicleClassId: string;
    minTage: number;
    maxTage: number | null;
    preisProTagCent: number;
  }[];
  addons: { id: string; name: string; preise: { id: string; vehicleClassId: string; preisCent: number }[] }[];
}

function centZuEingabe(cent: number): string {
  return (cent / 100).toFixed(2);
}
function eingabeZuCent(v: string): number | null {
  const n = Number(v.replace(",", "."));
  if (!isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
function staffelLabel(min: number, max: number | null): string {
  return max === null ? `ab ${min} Tage` : `${min}–${max} Tage`;
}

export function TarifEditor({ daten }: { daten: Daten }) {
  // Bearbeitungszustand: id -> EUR-Eingabestring
  const [tarifWerte, setTarifWerte] = useState<Record<string, string>>(
    () => Object.fromEntries(daten.tariffRules.map((t) => [t.id, centZuEingabe(t.preisProTagCent)]))
  );
  const [addonWerte, setAddonWerte] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        daten.addons.flatMap((a) => a.preise.map((p) => [p.id, centZuEingabe(p.preisCent)]))
      )
  );
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [fehler, setFehler] = useState<string | null>(null);

  const klasseName = (id: string) => daten.vehicleClasses.find((v) => v.id === id)?.name ?? "?";

  async function speichern() {
    setStatus("saving");
    setFehler(null);

    const tarifCents = Object.entries(tarifWerte).map(([id, v]) => ({ id, cent: eingabeZuCent(v) }));
    const addonCents = Object.entries(addonWerte).map(([id, v]) => ({ id, cent: eingabeZuCent(v) }));

    if ([...tarifCents, ...addonCents].some((x) => x.cent === null)) {
      setStatus("error");
      setFehler("Bitte nur gültige Preise (z. B. 45,00) eingeben.");
      return;
    }

    const tariffRules = tarifCents.map((x) => ({ id: x.id, preisProTagCent: x.cent as number }));
    const addonPrices = addonCents.map((x) => ({ id: x.id, preisCent: x.cent as number }));

    try {
      const res = await fetch("/api/admin/tarife", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tariffRules, addonPrices }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFehler(d.error ?? "Speichern fehlgeschlagen.");
        setStatus("error");
        return;
      }
      setStatus("ok");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setFehler("Speichern fehlgeschlagen.");
      setStatus("error");
    }
  }

  return (
    <div className="mt-8 space-y-10">
      {/* Parkgebühren je Produkt */}
      {daten.products.map((product) => {
        const regeln = daten.tariffRules.filter((t) => t.productId === product.id);
        const staffeln = [...new Set(regeln.map((r) => staffelLabel(r.minTage, r.maxTage)))];
        return (
          <section key={product.id} className="card overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-medium text-ink">{product.name}</h2>
              <p className="text-xs text-subtle">Preis pro Tag in Euro</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-subtle">
                    <th className="px-5 py-3 font-medium">Fahrzeugklasse</th>
                    {staffeln.map((s) => (
                      <th key={s} className="px-5 py-3 font-medium">{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {daten.vehicleClasses.map((vc) => (
                    <tr key={vc.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-3 text-ink">{vc.name}</td>
                      {regeln
                        .filter((r) => r.vehicleClassId === vc.id)
                        .map((r) => (
                          <td key={r.id} className="px-5 py-3">
                            <div className="flex items-center gap-1">
                              <input
                                value={tarifWerte[r.id] ?? ""}
                                onChange={(e) => setTarifWerte((p) => ({ ...p, [r.id]: e.target.value }))}
                                inputMode="decimal"
                                className="field w-24 !py-1.5"
                              />
                              <span className="text-subtle">€</span>
                            </div>
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      {/* Zusatzservice-Preise */}
      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h2 className="font-medium text-ink">Zusatzservices</h2>
          <p className="text-xs text-subtle">Preis je Fahrzeugklasse in Euro</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-subtle">
                <th className="px-5 py-3 font-medium">Service</th>
                {daten.vehicleClasses.map((vc) => (
                  <th key={vc.id} className="px-5 py-3 font-medium">{vc.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {daten.addons.map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 text-ink">{a.name}</td>
                  {daten.vehicleClasses.map((vc) => {
                    const preis = a.preise.find((p) => p.vehicleClassId === vc.id);
                    if (!preis) return <td key={vc.id} className="px-5 py-3 text-subtle">–</td>;
                    return (
                      <td key={vc.id} className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <input
                            value={addonWerte[preis.id] ?? ""}
                            onChange={(e) => setAddonWerte((p) => ({ ...p, [preis.id]: e.target.value }))}
                            inputMode="decimal"
                            className="field w-24 !py-1.5"
                            aria-label={`${a.name} ${klasseName(vc.id)}`}
                          />
                          <span className="text-subtle">€</span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="sticky bottom-4 flex items-center gap-4">
        <button onClick={speichern} disabled={status === "saving"} className="btn-gold">
          {status === "saving" ? "Speichern…" : "Änderungen speichern"}
        </button>
        {status === "ok" && <span className="text-sm text-[var(--success)]">Gespeichert ✓</span>}
        {status === "error" && <span className="text-sm text-[var(--danger)]">{fehler}</span>}
      </div>
    </div>
  );
}
