"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Kleiner Lösch-Button für Admin-Listen: sendet DELETE { id } und aktualisiert die Seite. */
export function LoeschButton({ endpoint, id }: { endpoint: string; id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function loeschen() {
    if (!confirm("Wirklich löschen?")) return;
    setLoading(true);
    try {
      await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={loeschen}
      disabled={loading}
      className="text-sm text-muted transition-colors hover:text-[var(--danger)] disabled:opacity-50"
    >
      {loading ? "…" : "Löschen"}
    </button>
  );
}
