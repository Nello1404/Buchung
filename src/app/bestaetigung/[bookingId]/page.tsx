import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { centZuEUR, formatDatumZeit } from "@/lib/format";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = { title: "Buchungsbestätigung – FlySpot Valet" };

export default async function BestaetigungPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { product: true, vehicle: true, addons: true, customer: true },
  });

  if (!booking) notFound();

  const bezahlt = booking.status !== "ANGEFRAGT" && booking.status !== "STORNIERT";

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-6 py-16">
        <div className="w-full max-w-xl">
          <div className="card p-8">
            {bezahlt ? (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full gold-gradient">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="#1a140a" strokeWidth="2.5">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h1 className="mt-5 font-serif text-2xl font-semibold text-ink">Buchung bestätigt</h1>
                <p className="mt-2 text-muted">
                  Vielen Dank, {booking.customer.name}. Eine Bestätigung wurde an{" "}
                  <span className="text-ink">{booking.customer.email}</span> gesendet.
                </p>
              </>
            ) : (
              <>
                <h1 className="font-serif text-2xl font-semibold text-gold">Zahlung wird verarbeitet…</h1>
                <p className="mt-2 text-muted">
                  Sobald die Zahlung eingegangen ist, erhalten Sie automatisch eine Bestätigungs-E-Mail.
                  Bitte laden Sie diese Seite in Kürze erneut.
                </p>
              </>
            )}

            <dl className="mt-7 space-y-0.5 text-sm">
              <Zeile label="Buchungsnummer" wert={booking.bookingNumber} gold />
              <Zeile label="Produkt" wert={booking.product.name} />
              <Zeile label="Anreise" wert={`${formatDatumZeit.format(booking.anreise)} Uhr`} />
              <Zeile label="Abreise" wert={`${formatDatumZeit.format(booking.abreise)} Uhr`} />
              {booking.rueckflugnummer && <Zeile label="Flugnummer (Rückflug)" wert={booking.rueckflugnummer} />}
              {booking.vehicle && <Zeile label="Kennzeichen" wert={booking.vehicle.kennzeichen} />}
              {booking.addons.map((a) => (
                <Zeile key={a.id} label={a.nameSnapshot} wert={centZuEUR(a.preisCentSnapshot)} />
              ))}
              <Zeile label="Gesamtpreis" wert={centZuEUR(booking.preisGesamtCent)} gold />
            </dl>

            <div className="mt-7 rounded-xl border border-line bg-surface-2 p-5 text-sm leading-relaxed text-muted">
              Bitte fahren Sie zur vereinbarten Zeit direkt zum FlySpot-Valet-Terminal am Flughafen
              Frankfurt und nennen Sie Ihre Buchungsnummer. Eine kostenlose Stornierung ist bis 48
              Stunden vor Anreise möglich.
            </div>

            <div className="mt-7 flex items-center justify-between">
              <Link href="/" className="text-sm font-medium text-muted transition-colors hover:text-ink">
                ← Zur Startseite
              </Link>
              {bezahlt && (
                <a href={`/api/booking/${booking.id}/rechnung`} className="text-sm font-medium text-gold hover:underline">
                  Rechnung herunterladen (PDF)
                </a>
              )}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Zeile({ label, wert, gold }: { label: string; wert: string; gold?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2">
      <dt className="text-muted">{label}</dt>
      <dd className={`text-right font-medium ${gold ? "text-gold" : "text-ink"}`}>{wert}</dd>
    </div>
  );
}
