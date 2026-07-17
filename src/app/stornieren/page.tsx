"use client";

import Link from "next/link";
import { useState } from "react";
import { centZuEUR } from "@/lib/format";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

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
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <p className="eyebrow">Stornierung</p>
            <h1 className="mt-3 font-serif text-2xl font-semibold text-ink">Buchung stornieren</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Bis 48 Stunden vor Anreise erhalten Sie 100 % erstattet, danach 50 %.
            </p>

            {ergebnis ? (
              <div className="mt-6 rounded-xl border border-[rgba(111,174,125,0.3)] bg-[rgba(111,174,125,0.08)] p-5 text-sm text-[var(--success)]">
                Ihre Buchung wurde storniert. Erstattung: {ergebnis.erstattungProzent} % (
                {centZuEUR(ergebnis.erstattetCent)}).
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink">Buchungsnummer</span>
                  <input
                    required
                    value={bookingNumber}
                    onChange={(e) => setBookingNumber(e.target.value)}
                    placeholder="FS-2026-123456"
                    className="field"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink">E-Mail-Adresse</span>
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
                </label>
                {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
                <button type="submit" disabled={loading} className="btn-gold w-full">
                  {loading ? "Wird storniert…" : "Buchung stornieren"}
                </button>
              </form>
            )}

            <Link href="/" className="mt-6 inline-block text-sm font-medium text-muted transition-colors hover:text-ink">
              ← Zur Startseite
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
