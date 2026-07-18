"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ZahlungMarkieren({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [laeuft, setLaeuft] = useState(false);

  async function markieren() {
    if (!confirm("Zahlung als eingegangen markieren? Sie zählt ab jetzt zum Umsatz.")) return;
    setLaeuft(true);
    const res = await fetch("/api/admin/zahlung", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    setLaeuft(false);
    if (res.ok) router.refresh();
    else alert("Konnte nicht aktualisiert werden.");
  }

  return (
    <button onClick={markieren} disabled={laeuft} className="btn-gold mt-3 !px-4 !py-2 text-sm">
      {laeuft ? "…" : "Als bezahlt markieren"}
    </button>
  );
}
