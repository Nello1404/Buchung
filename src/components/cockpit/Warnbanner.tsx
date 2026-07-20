"use client";

import { useEffect, useState } from "react";

/** Live-Warnungen (z. B. Überbuchung, Kapazitätsengpässe) – pollt alle 60 s. */
export function Warnbanner() {
  const [warnungen, setWarnungen] = useState<{ schwere: string; text: string }[]>([]);
  useEffect(() => {
    const lade = () =>
      fetch("/api/cockpit/warnungen", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { warnungen: [] }))
        .then((d) => setWarnungen(d.warnungen ?? []))
        .catch(() => {});
    lade();
    const id = setInterval(lade, 60000);
    return () => clearInterval(id);
  }, []);

  if (warnungen.length === 0) return null;
  return (
    <div className="mt-5 space-y-2">
      {warnungen.map((w, i) => (
        <div
          key={i}
          className={`flex items-start gap-2 rounded-lg border px-4 py-2.5 text-sm ${
            w.schwere === "warnung"
              ? "border-[rgba(217,138,128,0.4)] bg-[rgba(217,138,128,0.08)] text-[var(--danger)]"
              : "border-line-gold bg-[rgba(200,164,92,0.06)] text-gold"
          }`}
        >
          <span>{w.schwere === "warnung" ? "⚠" : "ⓘ"}</span>
          <span className="text-ink">{w.text}</span>
        </div>
      ))}
    </div>
  );
}
