"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BuchungLoeschen({ bookingId, bookingNumber }: { bookingId: string; bookingNumber: string }) {
  const router = useRouter();
  const [laeuft, setLaeuft] = useState(false);

  async function loeschen() {
    if (!confirm(`Buchung ${bookingNumber} endgültig löschen? Das kann nicht rückgängig gemacht werden.`)) return;
    setLaeuft(true);
    const res = await fetch(`/api/admin/buchungen/${bookingId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/buchungen");
      router.refresh();
    } else {
      setLaeuft(false);
      alert("Konnte nicht gelöscht werden.");
    }
  }

  return (
    <button
      onClick={loeschen}
      disabled={laeuft}
      className="text-sm text-[var(--danger)] underline-offset-2 hover:underline disabled:opacity-50"
    >
      {laeuft ? "Wird gelöscht …" : "Buchung löschen"}
    </button>
  );
}
