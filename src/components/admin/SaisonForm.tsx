"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface VehicleClass {
  id: string;
  name: string;
}

const heuteISO = () => new Date().toISOString().slice(0, 10);

function eingabeZuCent(v: string): number | null {
  const n = Number(v.replace(",", "."));
  if (!isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function SaisonForm({ vehicleClasses }: { vehicleClasses: VehicleClass[] }) {
  const router = useRouter();
  const [productCode, setProductCode] = useState<"VALET" | "SHUTTLE">("VALET");
  const [vehicleClassId, setVehicleClassId] = useState(vehicleClasses[0]?.id ?? "");
  const [name, setName] = useState("");
  const [vonDatum, setVon] = useState(heuteISO());
  const [bisDatum, setBis] = useState(heuteISO());
  const [preis, setPreis] = useState("");
  const [loading, setLoading] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  async function speichern(e: React.FormEvent) {
    e.preventDefault();
    setMeldung(null);
    setFehler(null);

    const cent = eingabeZuCent(preis);
    if (cent === null) {
      setFehler("Bitte einen gültigen Preis eingeben (z. B. 59,00).");
      return;
    }
    if (name.trim().length < 2) {
      setFehler("Bitte einen Namen für den Zeitraum angeben.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/saison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode,
          vehicleClassId,
          name: name.trim(),
          vonDatum,
          bisDatum,
          preisProTagCent: cent,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFehler(d.error ?? "Fehlgeschlagen.");
      } else {
        setMeldung("Saisonzeitraum angelegt.");
        setName("");
        setPreis("");
        router.refresh();
      }
    } catch {
      setFehler("Fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={speichern} className="mt-6 card flex flex-wrap items-end gap-3 p-5">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Produkt</span>
        <select
          value={productCode}
          onChange={(e) => setProductCode(e.target.value as "VALET" | "SHUTTLE")}
          className="field"
        >
          <option value="VALET">Valet</option>
          <option value="SHUTTLE">Shuttle</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Fahrzeugklasse</span>
        <select
          value={vehicleClassId}
          onChange={(e) => setVehicleClassId(e.target.value)}
          className="field"
        >
          {vehicleClasses.map((vc) => (
            <option key={vc.id} value={vc.id}>{vc.name}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Bezeichnung</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Sommerferien 2026"
          className="field w-52"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Von</span>
        <input type="date" value={vonDatum} onChange={(e) => setVon(e.target.value)} className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Bis</span>
        <input type="date" value={bisDatum} onChange={(e) => setBis(e.target.value)} className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Preis/Tag</span>
        <div className="flex items-center gap-1">
          <input
            value={preis}
            onChange={(e) => setPreis(e.target.value)}
            inputMode="decimal"
            placeholder="59,00"
            className="field w-24"
          />
          <span className="text-subtle">€</span>
        </div>
      </label>
      <button type="submit" disabled={loading} className="btn-gold">
        {loading ? "Speichern…" : "Saison anlegen"}
      </button>
      {meldung && <span className="w-full text-sm text-[var(--success)]">{meldung}</span>}
      {fehler && <span className="w-full text-sm text-[var(--danger)]">{fehler}</span>}
    </form>
  );
}
