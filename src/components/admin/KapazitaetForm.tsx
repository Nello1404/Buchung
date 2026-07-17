"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const heuteISO = () => new Date().toISOString().slice(0, 10);
const inTagen = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export function KapazitaetForm() {
  const router = useRouter();
  const [productCode, setProductCode] = useState<"VALET" | "SHUTTLE">("VALET");
  const [vonDatum, setVon] = useState(heuteISO());
  const [bisDatum, setBis] = useState(inTagen(30));
  const [kontingent, setKontingent] = useState("99");
  const [loading, setLoading] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  async function speichern(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMeldung(null);
    setFehler(null);
    const k = Number(kontingent);
    if (!Number.isInteger(k) || k < 0) {
      setFehler("Bitte eine gültige Zahl eingeben.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/kapazitaet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productCode, vonDatum, bisDatum, kontingent: k }),
      });
      const d = await res.json();
      if (!res.ok) {
        setFehler(d.error ?? "Fehlgeschlagen.");
      } else {
        setMeldung(`Kontingent für ${d.tage} Tag(e) gesetzt.`);
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
        <span className="mb-1.5 block text-sm font-medium text-ink">Von</span>
        <input type="date" value={vonDatum} onChange={(e) => setVon(e.target.value)} className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Bis</span>
        <input type="date" value={bisDatum} onChange={(e) => setBis(e.target.value)} className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Plätze/Tag</span>
        <input value={kontingent} onChange={(e) => setKontingent(e.target.value)} inputMode="numeric" className="field w-28" />
      </label>
      <button type="submit" disabled={loading} className="btn-gold">
        {loading ? "Speichern…" : "Kontingent setzen"}
      </button>
      {meldung && <span className="w-full text-sm text-[var(--success)]">{meldung}</span>}
      {fehler && <span className="w-full text-sm text-[var(--danger)]">{fehler}</span>}
    </form>
  );
}
