"use client";

import { useState } from "react";

interface Seite { slug: string; titel: string; inhalt: string }

export function InhalteEditor({ seiten }: { seiten: Seite[] }) {
  const [aktiv, setAktiv] = useState(seiten[0]?.slug ?? "");
  const [werte, setWerte] = useState<Record<string, string>>(
    () => Object.fromEntries(seiten.map((s) => [s.slug, s.inhalt]))
  );
  const [status, setStatus] = useState<"idle" | "saving" | "ok">("idle");

  const seite = seiten.find((s) => s.slug === aktiv);

  async function speichern() {
    if (!seite) return;
    setStatus("saving");
    await fetch("/api/admin/inhalte", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: aktiv, inhalt: werte[aktiv] ?? "" }),
    });
    setStatus("ok");
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex gap-2">
        {seiten.map((s) => (
          <button
            key={s.slug}
            onClick={() => setAktiv(s.slug)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              aktiv === s.slug ? "border-line-gold text-gold" : "border-line text-muted hover:text-ink"
            }`}
          >
            {s.titel}
          </button>
        ))}
      </div>
      <textarea
        value={werte[aktiv] ?? ""}
        onChange={(e) => setWerte((p) => ({ ...p, [aktiv]: e.target.value }))}
        rows={20}
        className="field font-mono text-sm"
        placeholder={`Inhalt für „${seite?.titel}“ hier einfügen…`}
      />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={speichern} disabled={status === "saving"} className="btn-gold">
          {status === "saving" ? "Speichern…" : "Speichern"}
        </button>
        {status === "ok" && <span className="text-sm text-[var(--success)]">Gespeichert ✓</span>}
        <a href={`/${aktiv}`} target="_blank" className="text-sm text-muted hover:text-ink">Vorschau ↗</a>
      </div>
    </div>
  );
}
