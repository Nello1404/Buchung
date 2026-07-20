"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Mitarbeiter {
  id: string;
  name: string;
  email: string | null;
  istFahrer: boolean;
  rolle: string | null;
  active: boolean;
  sortOrder: number;
}

interface FormState {
  id?: string;
  name: string;
  email: string;
  rolle: string;
  istFahrer: boolean;
  active: boolean;
}

function leer(): FormState {
  return { name: "", email: "", rolle: "", istFahrer: true, active: true };
}

export function MitarbeiterVerwaltung({ mitarbeiter }: { mitarbeiter: Mitarbeiter[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(leer());
  const [loading, setLoading] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);

  async function speichern(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFehler(null);
    try {
      const res = await fetch("/api/admin/mitarbeiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          name: form.name.trim(),
          email: form.email.trim(),
          rolle: form.rolle.trim(),
          istFahrer: form.istFahrer,
          active: form.active,
          sortOrder: form.id ? mitarbeiter.find((m) => m.id === form.id)?.sortOrder ?? 0 : mitarbeiter.length,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setFehler(d.error ?? "Speichern fehlgeschlagen.");
        return;
      }
      setForm(leer());
      router.refresh();
    } catch {
      setFehler("Speichern fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  async function loeschen(m: Mitarbeiter) {
    if (!confirm(`Mitarbeiter „${m.name}“ wirklich löschen? Geplante Schichten werden mit entfernt.`)) return;
    await fetch(`/api/admin/mitarbeiter/${m.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={speichern} className="mt-6 card p-5">
        <h2 className="font-serif text-lg font-semibold text-ink">
          {form.id ? "Mitarbeiter bearbeiten" : "Neuer Mitarbeiter"}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" required />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">E-Mail (für Einsatzplan)</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" placeholder="optional" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Rolle</span>
            <input value={form.rolle} onChange={(e) => setForm({ ...form, rolle: e.target.value })} className="field" placeholder="z. B. Fahrer, Büro (optional)" />
          </label>
          <div className="flex flex-col justify-end gap-2 pb-1">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.istFahrer} onChange={(e) => setForm({ ...form, istFahrer: e.target.checked })} />
              <span className="text-sm text-ink">Ist Fahrer (im Übergabeprotokoll wählbar)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <span className="text-sm text-ink">Aktiv</span>
            </label>
          </div>
        </div>
        {fehler && <p className="mt-3 text-sm text-[var(--danger)]">{fehler}</p>}
        <div className="mt-4 flex gap-3">
          <button type="submit" disabled={loading} className="btn-gold">
            {loading ? "Speichern…" : form.id ? "Speichern" : "Hinzufügen"}
          </button>
          {form.id && (
            <button type="button" onClick={() => setForm(leer())} className="text-sm text-muted hover:text-ink">
              Abbrechen
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-subtle">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Rolle</th>
                <th className="px-5 py-3 font-medium">Fahrer</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {mitarbeiter.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-muted">Noch keine Mitarbeiter angelegt.</td></tr>
              )}
              {mitarbeiter.map((m) => (
                <tr key={m.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3">
                    <span className="text-ink">{m.name}</span>
                    {m.email && <p className="mt-0.5 text-xs text-subtle">{m.email}</p>}
                  </td>
                  <td className="px-5 py-3 text-muted">{m.rolle || "–"}</td>
                  <td className="px-5 py-3">
                    {m.istFahrer ? <span className="text-gold">Ja</span> : <span className="text-subtle">Nein</span>}
                  </td>
                  <td className="px-5 py-3">
                    {m.active ? <span className="text-[var(--success)]">Aktiv</span> : <span className="text-subtle">Inaktiv</span>}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setForm({ id: m.id, name: m.name, email: m.email ?? "", rolle: m.rolle ?? "", istFahrer: m.istFahrer, active: m.active })}
                      className="text-sm text-gold hover:underline"
                    >
                      Bearbeiten
                    </button>
                    <button onClick={() => loeschen(m)} className="ml-4 text-sm text-muted hover:text-[var(--danger)]">
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
        Nur <span className="text-ink">aktive</span> Mitarbeiter mit <span className="text-ink">„Ist Fahrer“</span> erscheinen
        im Übergabeprotokoll. Alle aktiven Mitarbeiter lassen sich in der Einsatzplanung verplanen.
      </p>
    </div>
  );
}
