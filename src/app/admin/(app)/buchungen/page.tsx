import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { centZuEUR, formatDatumZeit, formatUhrzeit } from "@/lib/format";
import { berlinKalendertag } from "@/lib/date";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { Prisma } from "@/generated/prisma/client";

export default async function BuchungenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const suche = (q ?? "").trim();

  const where: Prisma.BookingWhereInput = suche
    ? {
        OR: [
          { bookingNumber: { contains: suche, mode: "insensitive" } },
          { customer: { name: { contains: suche, mode: "insensitive" } } },
          { customer: { email: { contains: suche, mode: "insensitive" } } },
          { vehicle: { kennzeichen: { contains: suche, mode: "insensitive" } } },
          { flugnummer: { contains: suche, mode: "insensitive" } },
        ],
      }
    : {};

  const heute = berlinKalendertag(new Date());
  const morgen = new Date(heute);
  morgen.setUTCDate(morgen.getUTCDate() + 1);

  const [ankuenfte, abholungen, buchungen] = await Promise.all([
    prisma.booking.findMany({
      where: { anreise: { gte: heute, lt: morgen }, status: { notIn: ["STORNIERT"] } },
      include: { customer: true, vehicle: true, product: true },
      orderBy: { anreise: "asc" },
    }),
    prisma.booking.findMany({
      where: { abreise: { gte: heute, lt: morgen }, status: { notIn: ["STORNIERT"] } },
      include: { customer: true, vehicle: true, product: true },
      orderBy: { abreise: "asc" },
    }),
    prisma.booking.findMany({
      where,
      include: { customer: true, vehicle: true, product: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-ink">Buchungen</h1>
      <p className="mt-1 text-sm text-muted">Tagesgeschäft und alle Buchungen im Überblick.</p>

      {!suche && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <TagesListe titel="Ankünfte heute (Abgabe)" typ="anreise" eintraege={ankuenfte} />
          <TagesListe titel="Abholungen heute" typ="abreise" eintraege={abholungen} />
        </div>
      )}

      <form className="mt-10 flex gap-3" action="/admin/buchungen">
        <input
          name="q"
          defaultValue={suche}
          placeholder="Suche: Buchungsnr., Name, E-Mail, Kennzeichen, Flugnr."
          className="field max-w-md"
        />
        <button type="submit" className="btn-outline !px-5 !py-2 text-sm">Suchen</button>
        {suche && <Link href="/admin/buchungen" className="btn-outline !px-5 !py-2 text-sm">Zurücksetzen</Link>}
      </form>

      <div className="mt-6 card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-subtle">
                <th className="px-5 py-3 font-medium">Buchungsnr.</th>
                <th className="px-5 py-3 font-medium">Kunde</th>
                <th className="px-5 py-3 font-medium">Produkt</th>
                <th className="px-5 py-3 font-medium">Anreise</th>
                <th className="px-5 py-3 font-medium">Preis</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {buchungen.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted">Keine Buchungen gefunden.</td></tr>
              )}
              {buchungen.map((b) => (
                <tr key={b.id} className="border-b border-line last:border-0 hover:bg-surface-2">
                  <td className="px-5 py-3">
                    <Link href={`/admin/buchungen/${b.id}`} className="text-gold hover:underline">{b.bookingNumber}</Link>
                  </td>
                  <td className="px-5 py-3 text-ink">{b.customer.name}</td>
                  <td className="px-5 py-3 text-muted">{b.product.code === "VALET" ? "Valet" : "Shuttle"}</td>
                  <td className="px-5 py-3 text-muted">{formatDatumZeit.format(b.anreise)}</td>
                  <td className="px-5 py-3 text-muted">{centZuEUR(b.preisGesamtCent)}</td>
                  <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type Eintrag = {
  id: string;
  anreise: Date;
  abreise: Date;
  flugnummer: string | null;
  customer: { name: string };
  vehicle: { kennzeichen: string } | null;
  product: { code: string };
};

function TagesListe({ titel, typ, eintraege }: { titel: string; typ: "anreise" | "abreise"; eintraege: Eintrag[] }) {
  return (
    <div className="card p-5">
      <h2 className="font-medium text-ink">{titel}</h2>
      {eintraege.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Keine Einträge für heute.</p>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {eintraege.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div>
                <Link href={`/admin/buchungen/${e.id}`} className="font-medium text-ink hover:text-gold">
                  {e.customer.name}
                </Link>
                <div className="text-xs text-muted">
                  {e.vehicle?.kennzeichen ?? "–"} · {e.product.code === "VALET" ? "Valet" : "Shuttle"}
                  {e.flugnummer ? ` · ✈ ${e.flugnummer}` : ""}
                </div>
              </div>
              <span className="text-gold">{formatUhrzeit.format(typ === "anreise" ? e.anreise : e.abreise)} Uhr</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
