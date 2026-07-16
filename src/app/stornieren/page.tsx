"use client";

import Link from "next/link";
import { useState } from "react";
import { centZuEUR } from "@/lib/format";

export default function StornierenPage() {
  const [bookingNumber, setBookingNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ergebnis, setErgebnis] = useState<{ erstattungProzent: number; erstattetCent: number } | null>(
    null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErgebnis(null);
    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingNumber: bookingNumber.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Stornierung fehlgeschlagen.");
      } else {
        setErgebnis(data);
      }
    } catch {
      setError("Stornierung fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-bold">Buchung stornieren</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Bis 48 Stunden vor Anreise erhalten Sie 100 % erstattet, danach 50 %.
        </p>

        {ergebnis ? (
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
            Ihre Buchung wurde storniert. Erstattung: {ergebnis.erstattungProzent} % (
            {centZuEUR(ergebnis.erstattetCent)}).
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Buchungsnummer</span>
              <input
                required
                value={bookingNumber}
                onChange={(e) => setBookingNumber(e.target.value)}
                placeholder="FS-2026-123456"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">E-Mail-Adresse</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-blue-900 px-6 py-2 font-semibold text-white disabled:opacity-40"
            >
              {loading ? "Wird storniert…" : "Buchung stornieren"}
            </button>
          </form>
        )}

        <Link href="/" className="mt-6 inline-block text-sm font-medium text-blue-900 dark:text-blue-300">
          ← Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
}
