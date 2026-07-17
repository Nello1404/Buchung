"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const heuteISO = () => new Date().toISOString().slice(0, 10);

export function SaisonForm() {
  const router = useRouter();
  const [productCode, setProductCode] = useState<"VALET" | "SHUTTLE">("VALET");
  const [name, setName] = useState("");
  const [vonDatum, setVon] = useState(heuteISO());
  const [bisDatum, setBis] = useState(heuteISO());
  const [zuschlag, setZuschlag] = useState("");
  const [loading, setLoading] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  async function speichern(e: React.FormEvent) {
    e.preventDefault();
    setMeldung(null);
    setFehler(null);

    const prozent = Number(zuschlag.replace(",", "."));
    if (!Number.isFinite(prozent) || prozent < 1) {
      setFehler("Bitte einen gültigen Zuschlag in % eingeben (z. B. 20).");
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
          name: name.trim(),
          vonDatum,
          bisDatum,
          zuschlagProzent: Math.round(prozent),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFehler(d.error ?? "Fehlgeschlagen.");
      } else {
        setMeldung("Saisonzeitraum angelegt.");
        setName("");
        setZuschlag("");
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
        <select value={productCode} onChange={(e) => setProductCode(e.target.value as "VALET" | "SHUTTLE")} className="field">
          <option value="VALET">Valet</option>
          <option value="SHUTTLE">Shuttle</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Bezeichnung</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Weihnachten 2026" className="field w-52" />
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
        <span className="mb-1.5 block text-sm font-medium text-ink">Zuschlag</span>
        <div className="flex items-center gap-1">
          <input value={zuschlag} onChange={(e) => setZuschlag(e.target.value)} inputMode="numeric" placeholder="20" className="field w-20" />
          <span className="text-subtle">%</span>
        </div>
      </label>
      <button type="submit" disabled={loading} className="btn-gold">
        {loading ? "Speichern…" : "Saison anlegen"}
      </button>
      <p className="w-full text-xs text-subtle">Der Zuschlag gilt für alle Fahrzeugklassen des gewählten Produkts im Zeitraum.</p>
      {meldung && <span className="w-full text-sm text-[var(--success)]">{meldung}</span>}
      {fehler && <span className="w-full text-sm text-[var(--danger)]">{fehler}</span>}
    </form>
  );
}
