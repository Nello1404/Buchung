"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AufraeumenButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);

  async function aufraeumen() {
    if (!confirm("Alle stornierten Buchungen endgültig löschen? (Für die Testphase gedacht.)")) return;
    setLoading(true);
    setMeldung(null);
    try {
      const res = await fetch("/api/admin/aufraeumen", { method: "POST" });
      const d = await res.json();
      if (res.ok) {
        setMeldung(`${d.geloescht} stornierte Buchung(en) gelöscht.`);
        router.refresh();
      } else {
        setMeldung(d.error ?? "Fehlgeschlagen.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button onClick={aufraeumen} disabled={loading} className="btn-outline !px-5 !py-2 text-sm">
        {loading ? "Räume auf…" : "Stornierte Buchungen aufräumen"}
      </button>
      {meldung && <span className="text-sm text-muted">{meldung}</span>}
    </div>
  );
}
