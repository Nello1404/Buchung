"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TvGate() {
  const router = useRouter();
  const [passwort, setPasswort] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/cockpit/tv-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passwort }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Fehlgeschlagen.");
      setLoading(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-8">
        <div className="text-center">
          <span className="font-serif text-xl font-semibold text-ink">FlySpot <span className="text-gold-gradient">Valet</span></span>
          <p className="mt-1 text-sm text-muted">TV-Modus · Anzeige</p>
        </div>
        <input
          type="password"
          required
          value={passwort}
          onChange={(e) => setPasswort(e.target.value)}
          placeholder="TV-Passwort"
          className="field"
          autoFocus
        />
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button type="submit" disabled={loading} className="btn-gold w-full">
          {loading ? "…" : "Anzeigen"}
        </button>
      </form>
    </div>
  );
}
