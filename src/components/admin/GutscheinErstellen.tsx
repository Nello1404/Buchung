"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Typ = "TAG_GRATIS" | "PROZENT" | "BETRAG";

export function GutscheinErstellen() {
  const router = useRouter();
  const [typ, setTyp] = useState<Typ>("PROZENT");
  const [wert, setWert] = useState("20");
  const [anzahl, setAnzahl] = useState("1");
  const [bezeichnung, setBezeichnung] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  async function erstellen(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFehler(null);
    setCodes(null);
    try {
      const body: Record<string, unknown> = {
        typ,
        anzahl: Number(anzahl) || 1,
        bezeichnung: bezeichnung.trim() || undefined,
        email: email.trim() || undefined,
      };
      if (typ !== "TAG_GRATIS") body.wert = Number(wert.replace(",", "."));

      const res = await fetch("/api/admin/gutscheine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) {
        setFehler(d.error ?? "Fehlgeschlagen.");
      } else {
        setCodes(d.codes);
        router.refresh();
      }
    } catch {
      setFehler("Fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={erstellen} className="mt-6 card p-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Typ</span>
          <select value={typ} onChange={(e) => setTyp(e.target.value as Typ)} className="field">
            <option value="PROZENT">Prozent-Rabatt</option>
            <option value="BETRAG">Euro-Rabatt</option>
            <option value="TAG_GRATIS">1 Tag gratis</option>
          </select>
        </label>
        {typ !== "TAG_GRATIS" && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">{typ === "PROZENT" ? "Prozent" : "Betrag (€)"}</span>
            <input value={wert} onChange={(e) => setWert(e.target.value)} inputMode="decimal" className="field w-24" />
          </label>
        )}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Anzahl</span>
          <input value={anzahl} onChange={(e) => setAnzahl(e.target.value)} inputMode="numeric" className="field w-20" />
        </label>
        <label className="block flex-1 min-w-[160px]">
          <span className="mb-1.5 block text-sm font-medium text-ink">Aktion/Bezeichnung (optional)</span>
          <input value={bezeichnung} onChange={(e) => setBezeichnung(e.target.value)} placeholder="z. B. Herbstaktion" className="field" />
        </label>
        <label className="block flex-1 min-w-[160px]">
          <span className="mb-1.5 block text-sm font-medium text-ink">An Kunde binden (optional)</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Mail" className="field" />
        </label>
        <button type="submit" disabled={loading} className="btn-gold">
          {loading ? "Erstellen…" : "Erstellen"}
        </button>
      </div>
      {fehler && <p className="mt-3 text-sm text-[var(--danger)]">{fehler}</p>}
      {codes && (
        <div className="mt-3 rounded-lg border border-line-gold bg-[rgba(200,164,92,0.06)] p-4 text-sm">
          <p className="mb-1 text-ink">{codes.length} Code(s) erstellt:</p>
          <p className="font-mono text-gold">{codes.join(", ")}</p>
        </div>
      )}
    </form>
  );
}
