import type { ReactNode } from "react";

/** Einheitlicher Seitenkopf: Titel + Beschreibung links, optionale Aktion rechts. */
export function PageHeader({
  titel,
  beschreibung,
  aktion,
}: {
  titel: string;
  beschreibung?: string;
  aktion?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink">{titel}</h1>
        {beschreibung && <p className="mt-1 max-w-2xl text-sm text-muted">{beschreibung}</p>}
      </div>
      {aktion && <div className="flex flex-wrap gap-2">{aktion}</div>}
    </div>
  );
}
