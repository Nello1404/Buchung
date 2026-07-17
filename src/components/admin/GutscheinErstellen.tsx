"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GutscheinErstellen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);

  async function erstellen(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMeldung(null);
    setFehler(null);
    try {
      const res = await fetch("/api/admin/gutscheine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });
      const d = await res.json();
      if (!res.ok) {
        setFehler(d.error ?? "Fehlgeschlagen.");
      } else {
        setMeldung(`Gutschein erstellt: ${d.code}`);
        setEmail("");
        setName("");
        router.refresh();
      }
    } catch {
      setFehler("Fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={erstellen} className="mt-6 card flex flex-wrap items-end gap-3 p-5">
      <label className="block flex-1 min-w-[200px]">
        <span className="mb-1.5 block text-sm font-medium text-ink">Kunden-E-Mail</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
      </label>
      <label className="block flex-1 min-w-[160px]">
        <span className="mb-1.5 block text-sm font-medium text-ink">Name (optional)</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className="field" />
      </label>
      <button type="submit" disabled={loading} className="btn-gold">
        {loading ? "Erstellen…" : "Gutschein erstellen"}
      </button>
      {meldung && <span className="w-full text-sm text-[var(--success)]">{meldung}</span>}
      {fehler && <span className="w-full text-sm text-[var(--danger)]">{fehler}</span>}
    </form>
  );
}
