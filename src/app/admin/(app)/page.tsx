import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { centZuEUR, formatUhrzeit } from "@/lib/format";
import { berlinKalendertag } from "@/lib/date";
import { getHeute, getTagDetail } from "@/lib/cockpit";
import { Warnbanner } from "@/components/cockpit/Warnbanner";

export default async function AdminUebersicht() {
  const heuteDate = berlinKalendertag(new Date());
  const morgen = new Date(heuteDate);
  morgen.setUTCDate(morgen.getUTCDate() + 1);
  const heuteISO = heuteDate.toISOString().slice(0, 10);

  const [heute, tag, offeneZahlungen, umsatzHeute] = await Promise.all([
    getHeute(),
    getTagDetail(heuteISO),
    prisma.payment.count({ where: { status: "OFFEN" } }),
    prisma.payment.aggregate({
      _sum: { betragCent: true },
      where: { status: "BEZAHLT", bezahltAm: { gte: heuteDate, lt: morgen } },
    }),
  ]);

  const kacheln = [
    { label: "Ankünfte heute", wert: String(heute.ankuenfteOffen + heute.ankuenfteErledigt), sub: `${heute.ankuenfteOffen} offen` },
    { label: "Abholungen heute", wert: String(heute.abholungenOffen + heute.abholungenErledigt), sub: `${heute.abholungenOffen} offen` },
    { label: "Auf dem Platz", wert: String(heute.physischeBelegung), sub: "Fahrzeuge aktuell" },
    { label: "Offene Zahlungen", wert: String(offeneZahlungen), sub: "unbezahlt", akzent: offeneZahlungen > 0 },
    { label: "Umsatz heute", wert: centZuEUR(umsatzHeute._sum.betragCent ?? 0), sub: "bezahlt eingegangen" },
  ];

  const auswertungen = [
    { href: "/cockpit/umsatz", titel: "Umsatz", text: "Erlöse, Trends und Auswertung nach Zeitraum." },
    { href: "/cockpit/finanzen", titel: "Finanzen", text: "Ausgaben, Liquidität und Monatsübersicht." },
    { href: "/cockpit/plan", titel: "Plan-Ist", text: "Soll-Ist-Vergleich der Monatsplanung." },
    { href: "/cockpit/tv", titel: "TV-Modus", text: "Betriebsanzeige für den Bildschirm (ohne Beträge).", extern: true },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Übersicht</h1>
          <p className="mt-1 text-sm text-muted">Ihr Tagesstart – Ankünfte, Abholungen und die wichtigsten Zahlen.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/manuell" className="btn-gold !px-4 !py-2 text-sm">+ Neue Buchung</Link>
          <Link href="/admin/buchungen" className="btn-outline !px-4 !py-2 text-sm">Alle Buchungen</Link>
        </div>
      </div>

      <Warnbanner />

      {/* Kennzahlen */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kacheln.map((k) => (
          <div key={k.label} className="card p-4">
            <div className="text-xs uppercase tracking-wide text-subtle">{k.label}</div>
            <div className={`mt-2 font-serif text-2xl font-semibold ${k.akzent ? "text-gold" : "text-ink"}`}>{k.wert}</div>
            <div className="mt-0.5 text-xs text-subtle">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Auslastung heute */}
      {heute.auslastung.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {heute.auslastung.map((a) => (
            <div key={a.code} className="card p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink">{a.name}</span>
                <span className="text-muted">{a.belegt} / {a.kontingent} · {a.prozent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(0,0,0,0.06)]">
                <div
                  className={`h-full rounded-full ${a.prozent >= 90 ? "bg-[#b0463c]" : a.prozent >= 70 ? "bg-[#b7902f]" : "bg-[#3f7d52]"}`}
                  style={{ width: `${Math.min(a.prozent, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Heute: Ankünfte & Abholungen */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <TagesListe titel="Ankünfte heute (Abgabe)" eintraege={tag.ankuenfte} />
        <TagesListe titel="Abholungen heute" eintraege={tag.abholungen} zeigeStellplatz />
      </div>

      {/* Auswertung */}
      <h2 className="mt-10 font-serif text-lg font-semibold text-ink">Auswertung</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {auswertungen.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            target={a.extern ? "_blank" : undefined}
            className="card p-5 transition-colors hover:border-line-gold"
          >
            <div className="font-medium text-ink">{a.titel} {a.extern && <span className="text-xs text-subtle">↗</span>}</div>
            <p className="mt-1 text-sm text-muted">{a.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

type Eintrag = { id: string; kunde: string; kennzeichen: string | null; produkt: string; stellplatz: string | null; uhrzeitISO: string };

function TagesListe({ titel, eintraege, zeigeStellplatz }: { titel: string; eintraege: Eintrag[]; zeigeStellplatz?: boolean }) {
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
                <Link href={`/admin/buchungen/${e.id}`} className="font-medium text-ink hover:text-gold">{e.kunde}</Link>
                <div className="text-xs text-muted">
                  {e.kennzeichen ?? "–"} · {e.produkt === "VALET" ? "Valet" : "Shuttle"}
                </div>
                {zeigeStellplatz && e.stellplatz && (
                  <div className="mt-0.5 text-xs font-medium text-gold">📍 {e.stellplatz}</div>
                )}
              </div>
              <span className="text-gold">{formatUhrzeit.format(new Date(e.uhrzeitISO))} Uhr</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
