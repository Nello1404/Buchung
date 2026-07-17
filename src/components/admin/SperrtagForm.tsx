"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const heuteISO = () => new Date().toISOString().slice(0, 10);

export function SperrtagForm() {
  const router = useRouter();
  const [productCode, setProductCode] = useState<"ALLE" | "VALET" | "SHUTTLE">("ALLE");
  const [datum, setDatum] = useState(heuteISO());
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  async function speichern(e: React.FormEvent) {
    e.preventDefault();
    setMeldung(null);
    setFehler(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sperrtage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productCode, datum, reason: reason.trim() || undefined }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFehler(d.error ?? "Fehlgeschlagen.");
      } else {
        setMeldung("Sperrtag angelegt.");
        setReason("");
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
        <span className="mb-1.5 block text-sm font-medium text-ink">Gilt für</span>
        <select
          value={productCode}
          onChange={(e) => setProductCode(e.target.value as "ALLE" | "VALET" | "SHUTTLE")}
          className="field"
        >
          <option value="ALLE">Alle Produkte</option>
          <option value="VALET">Nur Valet</option>
          <option value="SHUTTLE">Nur Shuttle</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Datum</span>
        <input type="date" value={datum} onChange={(e) => setDatum(e.target.value)} className="field" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink">Grund (optional)</span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="z. B. Wartung"
          className="field w-52"
        />
      </label>
      <button type="submit" disabled={loading} className="btn-gold">
        {loading ? "Speichern…" : "Sperrtag anlegen"}
      </button>
      {meldung && <span className="w-full text-sm text-[var(--success)]">{meldung}</span>}
      {fehler && <span className="w-full text-sm text-[var(--danger)]">{fehler}</span>}
    </form>
  );
}
