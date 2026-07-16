import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { centZuEUR, formatDatumZeit } from "@/lib/format";

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
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-16 dark:bg-zinc-950">
      <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        {bezahlt ? (
          <>
            <h1 className="text-2xl font-bold text-green-700 dark:text-green-400">
              Buchung bestätigt!
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Vielen Dank, {booking.customer.name}. Wir haben Ihnen eine Bestätigung an{" "}
              {booking.customer.email} gesendet.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-amber-600">Zahlung wird verarbeitet…</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Sobald die Zahlung bei uns eingegangen ist, erhalten Sie automatisch eine
              Bestätigungs-E-Mail. Laden Sie diese Seite in Kürze erneut.
            </p>
          </>
        )}

        <dl className="mt-6 space-y-2 text-sm">
          <Zeile label="Buchungsnummer" wert={booking.bookingNumber} />
          <Zeile label="Produkt" wert={booking.product.name} />
          <Zeile label="Anreise" wert={`${formatDatumZeit.format(booking.anreise)} Uhr`} />
          <Zeile label="Abreise" wert={`${formatDatumZeit.format(booking.abreise)} Uhr`} />
          {booking.flugnummer && <Zeile label="Flugnummer" wert={booking.flugnummer} />}
          {booking.vehicle && <Zeile label="Kennzeichen" wert={booking.vehicle.kennzeichen} />}
          {booking.addons.map((a) => (
            <Zeile key={a.id} label={a.nameSnapshot} wert={centZuEUR(a.preisCentSnapshot)} />
          ))}
          <Zeile label="Gesamtpreis" wert={centZuEUR(booking.preisGesamtCent)} />
        </dl>

        <p className="mt-8 text-sm text-zinc-500">
          Bitte fahren Sie zur vereinbarten Zeit direkt zum FlySpot-Valet-Terminal am Flughafen
          Frankfurt und nennen Sie Ihre Buchungsnummer. Eine kostenlose Stornierung ist bis 48
          Stunden vor Anreise möglich.
        </p>

        <div className="mt-6 flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-blue-900 dark:text-blue-300">
            ← Zurück zur Startseite
          </Link>
          {bezahlt && (
            <a
              href={`/api/booking/${booking.id}/rechnung`}
              className="text-sm font-medium text-blue-900 hover:underline dark:text-blue-300"
            >
              Rechnung herunterladen (PDF)
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Zeile({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="flex justify-between border-b border-dashed border-zinc-200 py-1 dark:border-zinc-700">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium">{wert}</dd>
    </div>
  );
}
