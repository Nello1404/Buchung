"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Fahrer {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
}

export function FahrerVerwaltung({ fahrer }: { fahrer: Fahrer[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function speichern(payload: Partial<Fahrer> & { name: string }) {
    setLoading(true);
    setFehler(null);
    try {
      const res = await fetch("/api/admin/fahrer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (!res.ok) {
        setFehler(d.error ?? "Speichern fehlgeschlagen.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setFehler("Speichern fehlgeschlagen.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function hinzufuegen(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 2) {
      setFehler("Bitte einen Namen angeben.");
      return;
    }
    const ok = await speichern({ name: n, active: true, sortOrder: fahrer.length });
    if (ok) setName("");
  }

  async function umschalten(f: Fahrer) {
    await speichern({ id: f.id, name: f.name, active: !f.active, sortOrder: f.sortOrder });
  }

  async function loeschen(f: Fahrer) {
    if (!confirm(`Fahrer „${f.name}“ wirklich löschen?`)) return;
    await fetch(`/api/admin/fahrer/${f.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={hinzufuegen} className="mt-6 card p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block flex-1 min-w-[200px]">
            <span className="mb-1.5 block text-sm font-medium text-ink">Name des Fahrers</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Max Mustermann"
              className="field"
            />
          </label>
          <button type="submit" disabled={loading} className="btn-gold">
            {loading ? "Speichern…" : "Fahrer hinzufügen"}
          </button>
        </div>
        {fehler && <p className="mt-3 text-sm text-[var(--danger)]">{fehler}</p>}
      </form>

      <div className="mt-8 card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-subtle">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {fahrer.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-muted">Noch keine Fahrer angelegt.</td></tr>
              )}
              {fahrer.map((f) => (
                <tr key={f.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3 text-ink">{f.name}</td>
                  <td className="px-5 py-3">
                    {f.active ? (
                      <span className="text-[var(--success)]">Aktiv</span>
                    ) : (
                      <span className="text-subtle">Inaktiv</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <button onClick={() => umschalten(f)} className="text-sm text-gold hover:underline">
                      {f.active ? "Deaktivieren" : "Aktivieren"}
                    </button>
                    <button onClick={() => loeschen(f)} className="ml-4 text-sm text-muted hover:text-[var(--danger)]">
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-4 text-sm text-subtle">
        Nur <span className="text-ink">aktive</span> Fahrer erscheinen im Übergabeprotokoll zur Auswahl.
        Gelöschte Fahrer bleiben in bereits erfassten Protokollen erhalten.
      </p>
    </div>
  );
}
