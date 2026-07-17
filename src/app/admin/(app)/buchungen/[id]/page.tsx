import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { centZuEUR, formatDatumZeit } from "@/lib/format";
import { StatusBadge } from "@/components/admin/StatusBadge";

export default async function BuchungDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await prisma.booking.findUnique({
    where: { id },
    include: { customer: true, vehicle: true, product: true, addons: true, payment: true },
  });
  if (!b) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/buchungen" className="text-sm text-muted hover:text-ink">← Zurück zur Liste</Link>
      <div className="mt-4 flex items-center gap-3">
        <h1 className="font-serif text-2xl font-semibold text-ink">{b.bookingNumber}</h1>
        <StatusBadge status={b.status} />
      </div>

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
          <Z l="Flugnummer" w={b.flugnummer ?? "–"} />
        </Block>
        <Block titel="Zahlung">
          <Z l="Parkgebühr" w={centZuEUR(b.preisTageCent)} />
          {b.addons.map((a) => <Z key={a.id} l={a.nameSnapshot} w={centZuEUR(a.preisCentSnapshot)} />)}
          {b.gutscheinRabattCent > 0 && <Z l="Gutschein" w={`-${centZuEUR(b.gutscheinRabattCent)}`} />}
          <Z l="Gesamt" w={centZuEUR(b.preisGesamtCent)} gold />
          {b.payment && <Z l="Erstattet" w={centZuEUR(b.payment.erstattetCent)} />}
        </Block>
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
