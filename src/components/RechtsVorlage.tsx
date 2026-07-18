import { VORLAGEN } from "@/lib/legal-templates";

// Rendert einen Absatz und hebt Füllfelder ⟨…⟩ deutlich hervor.
function Absatz({ text }: { text: string }) {
  const teile = text.split(/(⟨[^⟩]+⟩)/g);
  return (
    <p className="mt-3 leading-relaxed text-muted">
      {teile.map((t, i) =>
        t.startsWith("⟨") && t.endsWith("⟩") ? (
          <mark
            key={i}
            className="mx-0.5 rounded border border-line-gold bg-[rgba(217,178,94,0.14)] px-1.5 py-0.5 font-mono text-[0.85em] text-gold-light"
          >
            {t}
          </mark>
        ) : (
          <span key={i}>{t}</span>
        )
      )}
    </p>
  );
}

export function RechtsVorlage({ slug }: { slug: string }) {
  const abschnitte = VORLAGEN[slug] ?? [];

  return (
    <div className="mt-6">
      {/* ============================================================
          VOR LIVEGANG ENTFERNEN – Entwurfshinweis (nur für den Betreiber).
          Verschwindet automatisch, sobald in Admin → Rechtstexte ein
          finaler Inhalt gespeichert ist.
          ============================================================ */}
      <div
        role="note"
        className="rounded-xl border border-[rgba(217,178,94,0.5)] bg-[rgba(217,178,94,0.1)] p-4 text-sm"
      >
        <p className="font-semibold text-gold-light">⚠ Entwurfsvorlage – noch nicht rechtsverbindlich</p>
        <p className="mt-1.5 text-muted">
          Vor Veröffentlichung durch einen Rechtsanwalt oder einen geprüften Generator (z. B.
          eRecht24, IHK) finalisieren. Die gelb markierten Felder ⟨…⟩ müssen mit euren echten
          Angaben ersetzt werden. Diesen Hinweis nach dem Eintragen des finalen Texts in
          „Admin → Rechtstexte“ entfernen (er verschwindet dann automatisch).
        </p>
      </div>

      {/* Ankernavigation */}
      {abschnitte.length > 1 && (
        <nav aria-label="Inhaltsverzeichnis" className="mt-8 rounded-xl border border-line bg-surface p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle">Inhalt</p>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {abschnitte.map((a) => (
              <li key={a.id}>
                <a href={`#${a.id}`} className="text-sm text-muted underline-offset-2 hover:text-gold hover:underline">
                  {a.titel}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Abschnitte */}
      <div className="mt-10 space-y-10">
        {abschnitte.map((a) => (
          <section key={a.id} id={a.id} className="scroll-mt-24">
            <h2 className="font-serif text-xl font-semibold text-ink">{a.titel}</h2>
            {a.absaetze.map((p, i) => (
              <Absatz key={i} text={p} />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
