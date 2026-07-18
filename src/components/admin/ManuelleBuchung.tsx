"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { centZuEUR } from "@/lib/format";
import { ZAHLUNGSARTEN, type Zahlungsart } from "@/lib/manual-booking-schema";

type VehicleClass = { code: string; name: string };
type Addon = { code: string; name: string; preisCent: number };
type Quote = {
  tage: number;
  preisTageCent: number;
  preisAddonsCent: number;
  gutscheinRabattCent: number;
  preisGesamtCent: number;
  verfuegbar: boolean;
  ausgebuchteTage: string[];
  gutschein: { gueltig: boolean; grund?: string };
  error?: string;
};

const ZAHLUNGS_LABEL: Record<Zahlungsart, string> = {
  BAR: "Bar",
  EC: "EC-/Kartenzahlung",
  UEBERWEISUNG: "Überweisung (eingegangen)",
  RECHNUNG: "Auf Rechnung (offen)",
};

export function ManuelleBuchung() {
  const router = useRouter();
  const [vehicleClasses, setVehicleClasses] = useState<VehicleClass[]>([]);
  const [addonsList, setAddonsList] = useState<Addon[]>([]);

  const [productCode, setProductCode] = useState<"VALET" | "SHUTTLE">("VALET");
  const [vehicleClassCode, setVehicleClassCode] = useState("");
  const [anreiseDatum, setAnreiseDatum] = useState("");
  const [anreiseZeit, setAnreiseZeit] = useState("10:00");
  const [abreiseDatum, setAbreiseDatum] = useState("");
  const [abreiseZeit, setAbreiseZeit] = useState("18:00");
  const [addonCodes, setAddonCodes] = useState<string[]>([]);
  const [voucherCode, setVoucherCode] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [kennzeichen, setKennzeichen] = useState("");
  const [marke, setMarke] = useState("");
  const [farbe, setFarbe] = useState("");
  const [auffaelligkeiten, setAuffaelligkeiten] = useState("");
  const [flugnummer, setFlugnummer] = useState("");
  const [rueckflugnummer, setRueckflugnummer] = useState("");
  const [zahlungsart, setZahlungsart] = useState<Zahlungsart>("BAR");
  const [notiz, setNotiz] = useState("");

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vehicle-classes")
      .then((r) => r.json())
      .then((d) => {
        const classes: VehicleClass[] = d.vehicleClasses ?? [];
        setVehicleClasses(classes);
        setVehicleClassCode((v) => v || classes[0]?.code || "");
      })
      .catch(() => setVehicleClasses([]));
  }, []);

  useEffect(() => {
    if (!vehicleClassCode) return;
    fetch(`/api/service-addons?vehicleClass=${encodeURIComponent(vehicleClassCode)}`)
      .then((r) => r.json())
      .then((d) => setAddonsList(d.addons ?? []))
      .catch(() => setAddonsList([]));
  }, [vehicleClassCode]);

  const quotePayload = useMemo(
    () => ({
      productCode,
      vehicleClassCode,
      anreiseDatum,
      anreiseZeit,
      abreiseDatum,
      abreiseZeit,
      addonCodes,
      voucherCode: voucherCode.trim() || undefined,
      customerEmail: email.trim() || undefined,
    }),
    [productCode, vehicleClassCode, anreiseDatum, anreiseZeit, abreiseDatum, abreiseZeit, addonCodes, voucherCode, email]
  );

  useEffect(() => {
    if (!anreiseDatum || !abreiseDatum || !vehicleClassCode) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch("/api/booking/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotePayload),
        signal: controller.signal,
      })
        .then(async (r) => ({ ok: r.ok, body: (await r.json()) as Quote }))
        .then(({ ok, body }) => {
          if (ok) {
            setQuote(body);
            setQuoteError(null);
          } else {
            setQuote(null);
            setQuoteError(body.error ?? "Preis konnte nicht berechnet werden.");
          }
        })
        .catch((e) => {
          if (e.name !== "AbortError") setQuoteError("Preis konnte nicht berechnet werden.");
        });
    }, 400);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [quotePayload, anreiseDatum, abreiseDatum, vehicleClassCode]);

  function toggleAddon(code: string) {
    setAddonCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFehler(null);
    setErfolg(null);
    try {
      const res = await fetch("/api/admin/manuell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode,
          vehicleClassCode,
          anreiseDatum,
          anreiseZeit,
          abreiseDatum,
          abreiseZeit,
          addonCodes,
          voucherCode: voucherCode.trim() || undefined,
          flugnummer: flugnummer.trim() || undefined,
          rueckflugnummer: rueckflugnummer.trim() || undefined,
          zahlungsart,
          notiz: notiz.trim() || undefined,
          kunde: { name: name.trim(), email: email.trim(), telefon: telefon.trim() || undefined },
          fahrzeug: {
            kennzeichen: kennzeichen.trim(),
            marke: marke.trim() || undefined,
            farbe: farbe.trim() || undefined,
            auffaelligkeiten: auffaelligkeiten.trim() || undefined,
          },
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        setFehler(d.error ?? "Buchung fehlgeschlagen.");
        setSubmitting(false);
        return;
      }
      router.push(`/admin/buchungen/${d.bookingId}`);
    } catch {
      setFehler("Buchung fehlgeschlagen. Bitte erneut versuchen.");
      setSubmitting(false);
    }
  }

  const preisOk = quote && quote.verfuegbar && !quoteError;

  return (
    <form onSubmit={absenden} className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-8">
        {/* Leistung */}
        <fieldset className="card space-y-4 p-6">
          <legend className="px-1 font-medium text-ink">Leistung</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Produkt</span>
              <select className="field" value={productCode} onChange={(e) => setProductCode(e.target.value as "VALET" | "SHUTTLE")}>
                <option value="VALET">Valet</option>
                <option value="SHUTTLE">Shuttle</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Fahrzeugklasse</span>
              <select className="field" value={vehicleClassCode} onChange={(e) => setVehicleClassCode(e.target.value)}>
                {vehicleClasses.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Anreise</span>
              <div className="flex gap-2">
                <input type="date" className="field" value={anreiseDatum} onChange={(e) => setAnreiseDatum(e.target.value)} required />
                <input type="time" className="field w-28" value={anreiseZeit} onChange={(e) => setAnreiseZeit(e.target.value)} required />
              </div>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Abreise</span>
              <div className="flex gap-2">
                <input type="date" className="field" value={abreiseDatum} onChange={(e) => setAbreiseDatum(e.target.value)} required />
                <input type="time" className="field w-28" value={abreiseZeit} onChange={(e) => setAbreiseZeit(e.target.value)} required />
              </div>
            </label>
          </div>
          {addonsList.length > 0 && (
            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink">Zusatzservices</span>
              <div className="flex flex-wrap gap-2">
                {addonsList.map((a) => (
                  <button
                    type="button"
                    key={a.code}
                    onClick={() => toggleAddon(a.code)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      addonCodes.includes(a.code) ? "border-line-gold text-gold" : "border-line text-muted hover:text-ink"
                    }`}
                  >
                    {a.name} · {centZuEUR(a.preisCent)}
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Gutscheincode (optional)</span>
            <input className="field" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} />
            {quote?.gutschein && voucherCode && !quote.gutschein.gueltig && (
              <span className="mt-1 block text-xs text-[var(--danger)]">{quote.gutschein.grund}</span>
            )}
          </label>
        </fieldset>

        {/* Kunde */}
        <fieldset className="card space-y-4 p-6">
          <legend className="px-1 font-medium text-ink">Kunde</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Name *</span>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Telefon</span>
              <input className="field" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-ink">E-Mail (für Bestätigung – optional)</span>
              <input type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>
        </fieldset>

        {/* Fahrzeug */}
        <fieldset className="card space-y-4 p-6">
          <legend className="px-1 font-medium text-ink">Fahrzeug</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Kennzeichen *</span>
              <input className="field" value={kennzeichen} onChange={(e) => setKennzeichen(e.target.value)} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Marke</span>
              <input className="field" value={marke} onChange={(e) => setMarke(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Farbe</span>
              <input className="field" value={farbe} onChange={(e) => setFarbe(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Flugnummer Hinflug {productCode === "VALET" ? "*" : "(optional)"}</span>
              <input className="field" value={flugnummer} onChange={(e) => setFlugnummer(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">Flugnummer Rückflug (optional)</span>
              <input className="field" value={rueckflugnummer} onChange={(e) => setRueckflugnummer(e.target.value)} placeholder="für Landungs-Tracking" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-medium text-ink">Auffälligkeiten</span>
              <input className="field" value={auffaelligkeiten} onChange={(e) => setAuffaelligkeiten(e.target.value)} />
            </label>
          </div>
        </fieldset>

        {/* Zahlung & Notiz */}
        <fieldset className="card space-y-4 p-6">
          <legend className="px-1 font-medium text-ink">Zahlung</legend>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Zahlungsart</span>
            <select className="field" value={zahlungsart} onChange={(e) => setZahlungsart(e.target.value as Zahlungsart)}>
              {ZAHLUNGSARTEN.map((z) => (
                <option key={z} value={z}>{ZAHLUNGS_LABEL[z]}</option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-subtle">
              „Auf Rechnung“ legt die Zahlung als offen an – sie zählt erst nach „Als bezahlt markieren“ zum Umsatz.
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Interne Notiz (optional)</span>
            <textarea className="field min-h-20" value={notiz} onChange={(e) => setNotiz(e.target.value)} />
          </label>
        </fieldset>
      </div>

      {/* Zusammenfassung */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="card space-y-3 p-6">
          <h2 className="font-medium text-ink">Zusammenfassung</h2>
          {quoteError && <p className="text-sm text-[var(--danger)]">{quoteError}</p>}
          {!quote && !quoteError && <p className="text-sm text-subtle">Zeitraum wählen …</p>}
          {quote && !quoteError && (
            <dl className="space-y-1.5 text-sm">
              <Row l={`Parken (${quote.tage} Tag${quote.tage === 1 ? "" : "e"})`} w={centZuEUR(quote.preisTageCent)} />
              {quote.preisAddonsCent > 0 && <Row l="Zusatzservices" w={centZuEUR(quote.preisAddonsCent)} />}
              {quote.gutscheinRabattCent > 0 && <Row l="Gutschein" w={`− ${centZuEUR(quote.gutscheinRabattCent)}`} />}
              <div className="my-2 border-t border-line" />
              <Row l="Gesamt" w={centZuEUR(quote.preisGesamtCent)} gold />
              {!quote.verfuegbar && (
                <p className="mt-2 text-sm text-[var(--danger)]">
                  Kein Kontingent frei{quote.ausgebuchteTage.length ? ` (${quote.ausgebuchteTage.join(", ")})` : ""}.
                </p>
              )}
            </dl>
          )}
          {fehler && <p className="text-sm text-[var(--danger)]">{fehler}</p>}
          {erfolg && <p className="text-sm text-[var(--success)]">{erfolg}</p>}
          <button type="submit" disabled={submitting || !preisOk || !name || !kennzeichen} className="btn-gold w-full">
            {submitting ? "Wird gebucht …" : "Buchung anlegen"}
          </button>
        </div>
      </aside>
    </form>
  );
}

function Row({ l, w, gold }: { l: string; w: string; gold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{l}</dt>
      <dd className={gold ? "font-semibold text-gold" : "text-ink"}>{w}</dd>
    </div>
  );
}
