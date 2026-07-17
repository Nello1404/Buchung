import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AufraeumenButton } from "@/components/admin/AufraeumenButton";
import { centZuEUR } from "@/lib/format";
import { berlinKalendertag } from "@/lib/date";

export default async function AdminDashboard() {
  const heute = berlinKalendertag(new Date());
  const morgen = new Date(heute);
  morgen.setUTCDate(morgen.getUTCDate() + 1);

  const [buchungenGesamt, bezahlt, ankuenfteHeute, umsatz] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: "BEZAHLT" } }),
    prisma.booking.count({
      where: { anreise: { gte: heute, lt: morgen }, status: { not: "STORNIERT" } },
    }),
    prisma.payment.aggregate({
      _sum: { betragCent: true },
      where: { status: "BEZAHLT" },
    }),
  ]);

  const kacheln = [
    { label: "Buchungen gesamt", wert: String(buchungenGesamt) },
    { label: "Bezahlt", wert: String(bezahlt) },
    { label: "Ankünfte heute", wert: String(ankuenfteHeute) },
    { label: "Umsatz (bezahlt)", wert: centZuEUR(umsatz._sum.betragCent ?? 0) },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Überblick über Ihren Betrieb.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kacheln.map((k) => (
          <div key={k.label} className="card p-5">
            <div className="text-xs uppercase tracking-wide text-subtle">{k.label}</div>
            <div className="mt-2 font-serif text-2xl font-semibold text-ink">{k.wert}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 card p-6">
        <h2 className="font-medium text-ink">Schnellzugriff</h2>
        <p className="mt-1 text-sm text-muted">
          Passen Sie Ihre Preise jederzeit selbst an – Änderungen wirken sofort auf neue Buchungen.
        </p>
        <Link href="/admin/tarife" className="btn-gold mt-4 !px-5 !py-2 text-sm">
          Preise &amp; Tarife bearbeiten
        </Link>
      </div>

      <div className="mt-6 card p-6">
        <h2 className="font-medium text-ink">Wartung (Testphase)</h2>
        <p className="mt-1 text-sm text-muted">
          Entfernt alle stornierten Buchungen aus dem System – nützlich, um Testbuchungen aufzuräumen.
        </p>
        <div className="mt-4">
          <AufraeumenButton />
        </div>
      </div>
    </div>
  );
}
