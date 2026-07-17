"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { centZuEUR } from "@/lib/format";
import type { getCockpitData, getTagDetail } from "@/lib/cockpit";

type CockpitData = Awaited<ReturnType<typeof getCockpitData>>;
type TagDetail = Awaited<ReturnType<typeof getTagDetail>>;

const POLL_MS = 20000;

const ampelClass: Record<string, string> = {
  gruen: "bg-[#3f7d52]",
  gelb: "bg-[#b7902f]",
  rot: "bg-[#b0463c]",
};

const wochentage = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function tagNummer(iso: string) {
  return Number(iso.slice(8, 10));
}
function istHeute(iso: string) {
  return iso === new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Berlin" });
}

export function Cockpit({ initial }: { initial: CockpitData }) {
  const [data, setData] = useState<CockpitData>(initial);
  const [tag, setTag] = useState<string | null>(null);
  const [detail, setDetail] = useState<TagDetail | null>(null);
  const [aktualisiert, setAktualisiert] = useState<Date>(new Date());
  const detailRef = useRef<string | null>(null);
  useEffect(() => {
    detailRef.current = tag;
  }, [tag]);

  const ladeDaten = useCallback(async () => {
    try {
      const res = await fetch("/api/cockpit/data", { cache: "no-store" });
      if (res.ok) {
        setData(await res.json());
        setAktualisiert(new Date());
      }
    } catch {
      /* still, nächster Poll */
    }
  }, []);

  const ladeTag = useCallback(async (datum: string) => {
    const res = await fetch(`/api/cockpit/tag?datum=${datum}`, { cache: "no-store" });
    if (res.ok) setDetail(await res.json());
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      ladeDaten();
      if (detailRef.current) ladeTag(detailRef.current);
    }, POLL_MS);
    return () => clearInterval(id);
  }, [ladeDaten, ladeTag]);

  function oeffneTag(datum: string) {
    setTag(datum);
    setDetail(null);
    ladeTag(datum);
  }

  async function statusSetzen(bookingId: string, aktion: "ankunft" | "abholung") {
    await fetch("/api/cockpit/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, aktion }),
    });
    await Promise.all([ladeDaten(), tag ? ladeTag(tag) : Promise.resolve()]);
  }

  const h = data.heute;

  return (
    <div className="min-h-screen px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-ink">Betriebszentrale</h1>
            <p className="text-xs text-subtle">
              Live · aktualisiert {aktualisiert.toLocaleTimeString("de-DE", { timeZone: "Europe/Berlin" })} Uhr
            </p>
          </div>
          <div className="flex gap-3 text-sm">
            <Link href="/cockpit/umsatz" className="btn-outline !px-4 !py-2 text-sm">Umsatz</Link>
            <Link href="/admin" className="btn-outline !px-4 !py-2 text-sm">Admin</Link>
            <Link href="/cockpit/tv" className="btn-outline !px-4 !py-2 text-sm" target="_blank">TV-Modus</Link>
          </div>
        </div>

        {/* Heute-Kopfzeile */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <Kachel label="Ankünfte offen" wert={h.ankuenfteOffen} akzent />
          <Kachel label="Ankünfte erledigt" wert={h.ankuenfteErledigt} />
          <Kachel label="Abholungen offen" wert={h.abholungenOffen} akzent />
          <Kachel label="Abholungen erledigt" wert={h.abholungenErledigt} />
          <Kachel label="Autos auf Platz" wert={h.physischeBelegung} />
          <div className="card p-4">
            <div className="text-xs uppercase tracking-wide text-subtle">Auslastung heute</div>
            <div className="mt-2 space-y-1">
              {h.auslastung.map((a) => (
                <div key={a.code} className="flex items-center justify-between text-sm">
                  <span className="text-muted">{a.code === "VALET" ? "Valet" : "Shuttle"}</span>
                  <span className="font-medium text-ink">{a.prozent}%</span>
                </div>
              ))}
              {h.auslastung.length === 0 && <span className="text-sm text-subtle">–</span>}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Heatmap */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium text-ink">Belegung · nächste 8 Wochen</h2>
              <Legende />
            </div>
            <div className="card p-4">
              <div className="grid grid-cols-7 gap-1.5">
                {wochentage.map((w) => (
                  <div key={w} className="pb-1 text-center text-[10px] uppercase tracking-wide text-subtle">{w}</div>
                ))}
                {data.heatmap.map((t) => {
                  const valet = t.produkte.find((p) => p.code === "VALET");
                  const shuttle = t.produkte.find((p) => p.code === "SHUTTLE");
                  return (
                    <button
                      key={t.datum}
                      onClick={() => oeffneTag(t.datum)}
                      className={`flex flex-col gap-1 rounded-md border p-1.5 text-left transition-colors hover:border-line-gold ${
                        tag === t.datum ? "border-line-gold" : istHeute(t.datum) ? "border-gold" : "border-line"
                      }`}
                      title={t.datum}
                    >
                      <span className={`text-[11px] ${istHeute(t.datum) ? "text-gold" : "text-muted"}`}>{tagNummer(t.datum)}</span>
                      <span className={`h-1.5 rounded-full ${valet ? ampelClass[valet.farbe] : "bg-[var(--bg-elev-2)]"}`} title={valet ? `Valet ${valet.prozent}%` : "Valet –"} />
                      <span className={`h-1.5 rounded-full ${shuttle ? ampelClass[shuttle.farbe] : "bg-[var(--bg-elev-2)]"}`} title={shuttle ? `Shuttle ${shuttle.prozent}%` : "Shuttle –"} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tagesdetail */}
            {tag && (
              <div className="mt-4 card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-medium text-ink">Details {tag}</h3>
                  <button onClick={() => setTag(null)} className="text-sm text-muted hover:text-ink">Schließen</button>
                </div>
                {!detail ? (
                  <p className="text-sm text-muted">Lädt…</p>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    <DetailListe titel="Ankünfte" eintraege={detail.ankuenfte} aktion="ankunft" onStatus={statusSetzen} />
                    <DetailListe titel="Abholungen" eintraege={detail.abholungen} aktion="abholung" onStatus={statusSetzen} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Live-Feed */}
          <div>
            <h2 className="mb-3 font-medium text-ink">Live-Eingänge</h2>
            <div className="card divide-y divide-line">
              {data.feed.length === 0 && <p className="p-5 text-sm text-muted">Noch keine Buchungen.</p>}
              {data.feed.map((f) => (
                <div key={f.id + f.zeit} className="flex items-center justify-between gap-3 p-3.5 text-sm">
                  <div>
                    <div className="font-medium text-ink">
                      {f.storniert ? <span className="text-[var(--danger)]">Storno · </span> : ""}
                      {f.kunde}
                    </div>
                    <div className="text-xs text-subtle">
                      {f.bookingNumber} · {f.produkt === "VALET" ? "Valet" : "Shuttle"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={f.storniert ? "text-[var(--danger)]" : "text-gold"}>{centZuEUR(f.betragCent)}</div>
                    <div className="text-xs text-subtle">
                      {new Date(f.zeit).toLocaleTimeString("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kachel({ label, wert, akzent }: { label: string; wert: number; akzent?: boolean }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-subtle">{label}</div>
      <div className={`mt-2 font-serif text-3xl font-semibold ${akzent && wert > 0 ? "text-gold" : "text-ink"}`}>{wert}</div>
    </div>
  );
}

function Legende() {
  return (
    <div className="flex items-center gap-3 text-[11px] text-subtle">
      <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#3f7d52]" /> frei</span>
      <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#b7902f]" /> knapp</span>
      <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#b0463c]" /> voll</span>
    </div>
  );
}

type DetailEintrag = TagDetail["ankuenfte"][number];

function DetailListe({
  titel,
  eintraege,
  aktion,
  onStatus,
}: {
  titel: string;
  eintraege: DetailEintrag[];
  aktion: "ankunft" | "abholung";
  onStatus: (id: string, a: "ankunft" | "abholung") => void;
}) {
  const erledigt = (s: string) =>
    aktion === "ankunft"
      ? ["UEBERGEBEN", "GEPARKT", "BEREITGESTELLT", "ABGESCHLOSSEN"].includes(s)
      : s === "ABGESCHLOSSEN";

  return (
    <div>
      <h4 className="mb-2 text-sm font-medium text-ink">{titel} ({eintraege.length})</h4>
      {eintraege.length === 0 ? (
        <p className="text-sm text-subtle">Keine.</p>
      ) : (
        <ul className="space-y-2">
          {eintraege.map((e) => (
            <li key={e.id} className="rounded-lg border border-line p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-ink">{e.kunde}</span>
                <span className="text-gold">{new Date(e.uhrzeitISO).toLocaleTimeString("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" })} Uhr</span>
              </div>
              <div className="mt-0.5 text-xs text-muted">
                {e.kennzeichen ?? "–"} · {e.produkt === "VALET" ? "Valet" : "Shuttle"}
                {e.flugnummer ? ` · ✈ ${e.flugnummer}` : ""}
              </div>
              {e.addons.length > 0 && <div className="mt-0.5 text-xs text-subtle">{e.addons.join(", ")}</div>}
              <div className="mt-2">
                {erledigt(e.status) ? (
                  <span className="text-xs text-[var(--success)]">✓ erledigt</span>
                ) : (
                  <button
                    onClick={() => onStatus(e.id, aktion)}
                    className="rounded-full border border-line-gold px-3 py-1 text-xs text-gold hover:bg-[rgba(200,164,92,0.08)]"
                  >
                    {aktion === "ankunft" ? "Ankunft erledigt" : "Abholung erledigt"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
