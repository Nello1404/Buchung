"use client";

import { useState } from "react";

interface Leistung {
  code: string;
  name: string;
  kategorie: string;
  typ: "FESTPREIS" | "ANFRAGE";
}

export function ServiceAnfrageForm({ leistungen }: { leistungen: Leistung[] }) {
  const [gewaehlt, setGewaehlt] = useState<Record<string, boolean>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [kennzeichen, setKennzeichen] = useState("");
  const [fahrzeug, setFahrzeug] = useState("");
  const [wunschtermin, setWunschtermin] = useState("");
  const [nachricht, setNachricht] = useState("");
  const [loading, setLoading] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState(false);

  function toggle(name: string) {
    setGewaehlt((g) => ({ ...g, [name]: !g[name] }));
  }

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    setFehler(null);
    const ausgewaehlt = leistungen.filter((l) => gewaehlt[l.name]).map((l) => l.name);
    const leistungenText = ausgewaehlt.join(", ");
    if (!name.trim() || !email.trim() || !leistungenText) {
      setFehler("Bitte Name, E-Mail und mindestens eine Leistung auswählen.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/service/anfrage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          telefon: telefon.trim() || undefined,
          kennzeichen: kennzeichen.trim() || undefined,
          fahrzeug: fahrzeug.trim() || undefined,
          wunschtermin: wunschtermin.trim() || undefined,
          leistungen: leistungenText,
          nachricht: nachricht.trim() || undefined,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setFehler(d.error ?? "Senden fehlgeschlagen.");
      } else {
        setErfolg(true);
      }
    } catch {
      setFehler("Senden fehlgeschlagen. Bitte später erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  if (erfolg) {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-line-gold">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-gold" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mt-4 font-serif text-xl font-semibold text-ink">Vielen Dank!</h3>
        <p className="mt-2 text-muted">
          Ihre Anfrage ist bei uns eingegangen. Wir melden uns zeitnah mit einem persönlichen Angebot.
          Eine Bestätigung haben wir an Ihre E-Mail-Adresse gesendet.
        </p>
      </div>
    );
  }

  // Leistungen nach Kategorie gruppieren für die Auswahl.
  const gruppen = new Map<string, Leistung[]>();
  for (const l of leistungen) {
    const arr = gruppen.get(l.kategorie) ?? [];
    arr.push(l);
    gruppen.set(l.kategorie, arr);
  }

  return (
    <form onSubmit={absenden} className="card p-6 sm:p-8">
      <fieldset>
        <legend className="text-sm font-medium text-ink">Gewünschte Leistungen</legend>
        <div className="mt-3 space-y-4">
          {[...gruppen.entries()].map(([kategorie, list]) => (
            <div key={kategorie}>
              <p className="mb-2 text-xs uppercase tracking-wide text-subtle">{kategorie}</p>
              <div className="flex flex-wrap gap-2">
                {list.map((l) => {
                  const aktiv = !!gewaehlt[l.name];
                  return (
                    <button
                      type="button"
                      key={l.code}
                      onClick={() => toggle(l.name)}
                      aria-pressed={aktiv}
                      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                        aktiv
                          ? "border-line-gold bg-[rgba(200,164,92,0.12)] text-gold"
                          : "border-line text-muted hover:text-ink"
                      }`}
                    >
                      {l.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Name *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="field" required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">E-Mail *</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" required />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Telefon</span>
          <input value={telefon} onChange={(e) => setTelefon(e.target.value)} className="field" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Kennzeichen</span>
          <input value={kennzeichen} onChange={(e) => setKennzeichen(e.target.value)} className="field" placeholder="z. B. F-AB 1234" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Fahrzeug</span>
          <input value={fahrzeug} onChange={(e) => setFahrzeug(e.target.value)} className="field" placeholder="z. B. VW Golf, schwarz" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Wunschtermin</span>
          <input value={wunschtermin} onChange={(e) => setWunschtermin(e.target.value)} className="field" placeholder="z. B. während meiner Reise 12.–19.08." />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-ink">Nachricht (optional)</span>
          <textarea value={nachricht} onChange={(e) => setNachricht(e.target.value)} rows={3} className="field" placeholder="Beschreiben Sie z. B. den Schaden oder Ihre Wünsche." />
        </label>
      </div>

      {fehler && <p className="mt-4 text-sm text-[var(--danger)]">{fehler}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={loading} className="btn-gold">
          {loading ? "Wird gesendet…" : "Unverbindlich anfragen"}
        </button>
        <p className="text-xs text-subtle">Kostenlos & unverbindlich. Wir melden uns mit einem Angebot.</p>
      </div>
    </form>
  );
}
