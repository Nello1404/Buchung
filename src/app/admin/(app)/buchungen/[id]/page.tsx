import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { centZuEUR, formatDatumZeit } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StatusSteuerung } from "@/components/admin/StatusSteuerung";
import { ZahlungMarkieren } from "@/components/admin/ZahlungMarkieren";
import { BuchungLoeschen } from "@/components/admin/BuchungLoeschen";
import { FlugStatusBadge } from "@/components/FlugStatusBadge";

const ZAHLUNGSART_LABEL: Record<string, string> = {
  BAR: "Bar",
  EC: "EC-/Kartenzahlung",
  UEBERWEISUNG: "Überweisung",
  RECHNUNG: "Auf Rechnung",
};

export default async function BuchungDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ neu?: string }>;
}) {
  const { id } = await params;
  const { neu } = await searchParams;
  const b = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      vehicle: true,
      product: true,
      addons: true,
      payment: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
      _count: { select: { protokolle: true } },
    },
  });
  if (!b) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/buchungen" className="text-sm text-muted hover:text-ink">← Zurück zur Liste</Link>
      {neu && (
        <div className="mt-4 rounded-lg border border-line-gold bg-[rgba(200,164,92,0.08)] px-4 py-3 text-sm text-ink">
          ✓ Buchung <span className="font-medium text-gold">{b.bookingNumber}</span> wurde angelegt.
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-2xl font-semibold text-ink">{b.bookingNumber}</h1>
        <StatusBadge status={b.status} />
        <Link href={`/admin/buchungen/${b.id}/protokoll`} className="btn-outline !px-4 !py-1.5 text-sm">
          Übergabeprotokoll{b._count.protokolle > 0 ? ` (${b._count.protokolle})` : ""}
        </Link>
      </div>

      {b.status !== "STORNIERT" && (
        <div className="mt-6">
          <StatusSteuerung
            bookingId={b.id}
            status={b.status}
            stellplatz={b.stellplatz}
            events={b.statusEvents.map((e) => ({ status: e.status, createdAt: e.createdAt.toISOString(), von: e.von }))}
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <Block titel="Kunde">
          <Z l="Name" w={b.customer.name} />
          <Z l="E-Mail" w={b.customer.email} />
          <Z l="Telefon" w={b.customer.phone ?? "–"} />
        </Block>
        <Block titel="Fahrzeug">
          <Z l="Kennzeichen" w={b.vehicle?.kennzeichen ?? "–"} />
          <Z l="Klasse" w={b.vehicle?.vehicleClassNameSnapshot ?? "–"} />
          <Z l="Marke/Farbe" w={[b.vehicle?.marke, b.vehicle?.farbe].filter(Boolean).join(" / ") || "–"} />
          {b.vehicle?.auffaelligkeiten && <Z l="Auffälligkeiten" w={b.vehicle.auffaelligkeiten} />}
        </Block>
        <Block titel="Zeitraum">
          <Z l="Produkt" w={b.product.name} />
          <Z l="Anreise" w={`${formatDatumZeit.format(b.anreise)} Uhr`} />
          <Z l="Abreise" w={`${formatDatumZeit.format(b.abreise)} Uhr`} />
          <Z l="Flugnummer (Rückflug)" w={b.rueckflugnummer ?? "–"} />
          <div className="flex items-center justify-between gap-4 py-1">
            <dt className="text-muted">Ankunft (live)</dt>
            <dd><FlugStatusBadge bookingId={b.id} /></dd>
          </div>
        </Block>
        <Block titel="Zahlung">
          <Z l="Parkgebühr" w={centZuEUR(b.preisTageCent)} />
          {b.addons.map((a) => <Z key={a.id} l={a.nameSnapshot} w={centZuEUR(a.preisCentSnapshot)} />)}
          {b.gutscheinRabattCent > 0 && <Z l="Gutschein" w={`-${centZuEUR(b.gutscheinRabattCent)}`} />}
          <Z l="Gesamt" w={centZuEUR(b.preisGesamtCent)} gold />
          {b.payment?.zahlungsart && <Z l="Zahlungsart" w={ZAHLUNGSART_LABEL[b.payment.zahlungsart] ?? b.payment.zahlungsart} />}
          {b.payment && (
            <Z l="Zahlungsstatus" w={b.payment.status === "BEZAHLT" ? "Bezahlt" : b.payment.status === "OFFEN" ? "Offen" : b.payment.status} />
          )}
          {b.payment && b.payment.erstattetCent > 0 && <Z l="Erstattet" w={centZuEUR(b.payment.erstattetCent)} />}
          {b.payment && b.payment.status === "OFFEN" && b.status !== "STORNIERT" && (
            <ZahlungMarkieren bookingId={b.id} />
          )}
        </Block>

        {b.notiz && (
          <Block titel="Interne Notiz">
            <p className="text-sm text-muted">{b.notiz}</p>
          </Block>
        )}
      </div>

      <div className="mt-10 border-t border-line pt-5">
        <p className="mb-2 text-xs text-subtle">Testdaten-Verwaltung – entfernt die Buchung endgültig und gibt das Kontingent frei.</p>
        <BuchungLoeschen bookingId={b.id} bookingNumber={b.bookingNumber} />
      </div>
    </div>
  );
}

function Block({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h2 className="mb-3 font-medium text-ink">{titel}</h2>
      <dl className="space-y-0.5 text-sm">{children}</dl>
    </div>
  );
}
function Z({ l, w, gold }: { l: string; w: string; gold?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-1.5 last:border-0">
      <dt className="text-muted">{l}</dt>
      <dd className={`text-right ${gold ? "font-medium text-gold" : "text-ink"}`}>{w}</dd>
    </div>
  );
}
