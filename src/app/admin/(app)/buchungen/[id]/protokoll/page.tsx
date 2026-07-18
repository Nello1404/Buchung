import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDatumZeit } from "@/lib/format";
import { blobKonfiguriert } from "@/lib/blob";
import { phaseLabel, type HandoverPhaseCode } from "@/lib/handover";
import { ProtokollForm } from "@/components/admin/ProtokollForm";

export const metadata = { title: "Übergabeprotokoll – FlySpot Valet" };

export default async function ProtokollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      vehicle: true,
      protokolle: { include: { fotos: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!booking) notFound();

  const hatEinfahrt = booking.protokolle.some((p) => p.phase === "EINFAHRT");
  const standardPhase: HandoverPhaseCode = hatEinfahrt ? "AUSFAHRT" : "EINFAHRT";

  return (
    <div className="max-w-3xl">
      <Link href={`/admin/buchungen/${id}`} className="text-sm text-muted hover:text-ink">← Zurück zur Buchung</Link>
      <h1 className="mt-4 font-serif text-2xl font-semibold text-ink">Übergabeprotokoll</h1>
      <p className="mt-1 text-sm text-muted">
        {booking.bookingNumber} · {booking.customer.name}
        {booking.vehicle?.kennzeichen ? ` · ${booking.vehicle.kennzeichen}` : ""}
      </p>

      <div className="mt-8">
        <ProtokollForm bookingId={id} blobKonfiguriert={blobKonfiguriert()} standardPhase={standardPhase} />
      </div>

      <h2 className="mt-12 font-serif text-lg font-semibold text-ink">Erfasste Protokolle</h2>
      {booking.protokolle.length === 0 ? (
        <p className="mt-2 text-sm text-subtle">Noch kein Protokoll erfasst.</p>
      ) : (
        <div className="mt-4 space-y-6">
          {booking.protokolle.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full border border-line-gold px-3 py-1 text-sm text-gold">
                  {phaseLabel(p.phase)}
                </span>
                <span className="text-xs text-subtle">{formatDatumZeit.format(p.createdAt)} Uhr · {p.erstelltVon}</span>
              </div>

              <dl className="mt-4 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
                <Z l="Fahrer" w={p.fahrer} />
                <Z l="Kilometerstand" w={p.kmStand != null ? `${p.kmStand.toLocaleString("de-DE")} km` : "–"} />
                <Z l="Tank-/Ladestand" w={p.tankstand ?? "–"} />
              </dl>

              {p.bemerkung && (
                <div className="mt-3">
                  <p className="text-xs text-subtle">Bemerkungen</p>
                  <p className="text-sm text-muted">{p.bemerkung}</p>
                </div>
              )}

              {p.fotos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {p.fotos.map((f) => (
                    <a key={f.id} href={f.url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt="Übergabefoto" className="h-24 w-full rounded-lg object-cover" />
                    </a>
                  ))}
                </div>
              )}

              {p.unterschriftUrl && (
                <div className="mt-4">
                  <p className="text-xs text-subtle">Unterschrift Kunde</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.unterschriftUrl} alt="Unterschrift" className="mt-1 h-20 rounded-lg border border-line bg-white p-1" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Z({ l, w }: { l: string; w: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-1">
      <dt className="text-muted">{l}</dt>
      <dd className="text-ink">{w}</dd>
    </div>
  );
}
