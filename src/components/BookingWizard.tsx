"use client";

import { useEffect, useMemo, useState } from "react";
import { centZuEUR } from "@/lib/format";

type ProductCode = "VALET" | "SHUTTLE";

interface Addon {
  code: string;
  name: string;
  description: string | null;
  preisCent: number | null;
}

interface VehicleClass {
  code: string;
  name: string;
}

interface QuoteResponse {
  tage: number;
  preisTageCent: number;
  preisAddonsCent: number;
  gutscheinRabattCent: number;
  preisGesamtCent: number;
  addonBreakdown: { code: string; name: string; preisCent: number }[];
  verfuegbar: boolean;
  ausgebuchteTage: string[];
  gutschein: { gueltig: boolean; grund?: string };
  error?: string;
  code?: string;
}

const heuteISO = () => new Date().toISOString().slice(0, 10);
const inTagen = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export default function BookingWizard() {
  const [step, setStep] = useState(1);

  const [productCode, setProductCode] = useState<ProductCode>("VALET");
  const [vehicleClasses, setVehicleClasses] = useState<VehicleClass[]>([]);
  const [vehicleClassCode, setVehicleClassCode] = useState("");
  const [anreiseDatum, setAnreiseDatum] = useState(inTagen(3));
  const [anreiseZeit, setAnreiseZeit] = useState("14:00");
  const [abreiseDatum, setAbreiseDatum] = useState(inTagen(6));
  const [abreiseZeit, setAbreiseZeit] = useState("10:00");

  const [addonsList, setAddonsList] = useState<Addon[]>([]);
  const [addonCodes, setAddonCodes] = useState<string[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [kennzeichen, setKennzeichen] = useState("");
  const [marke, setMarke] = useState("");
  const [farbe, setFarbe] = useState("");
  const [auffaelligkeiten, setAuffaelligkeiten] = useState("");
  const [rueckflugnummer, setRueckflugnummer] = useState("");
  const [voucherCode, setVoucherCode] = useState("");

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vehicle-classes")
      .then((r) => r.json())
      .then((d) => {
        const classes: VehicleClass[] = d.vehicleClasses ?? [];
        setVehicleClasses(classes);
        if (classes.length && !vehicleClassCode) setVehicleClassCode(classes[0].code);
      })
      .catch(() => setVehicleClasses([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Zusatzservice-Preise hängen von der Fahrzeugklasse ab → bei Klassenwechsel neu laden.
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
    const timeout = setTimeout(async () => {
      setQuoteLoading(true);
      setQuoteError(null);
      try {
        const res = await fetch("/api/booking/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quotePayload),
          signal: controller.signal,
        });
        const data: QuoteResponse = await res.json();
        if (!res.ok) {
          setQuoteError(data.error ?? "Preis konnte nicht berechnet werden.");
          setQuote(null);
        } else {
          setQuote(data);
        }
      } catch {
        if (!controller.signal.aborted) setQuoteError("Preis konnte nicht berechnet werden.");
      } finally {
        if (!controller.signal.aborted) setQuoteLoading(false);
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [quotePayload, anreiseDatum, abreiseDatum, vehicleClassCode]);

  function toggleAddon(code: string) {
    setAddonCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  const schritt1Gueltig =
    !!anreiseDatum && !!abreiseDatum && !!vehicleClassCode && !quoteLoading && !quoteError && !!quote?.verfuegbar;

  const schritt3Gueltig =
    name.trim().length > 1 &&
    /\S+@\S+\.\S+/.test(email) &&
    kennzeichen.trim().length > 1 &&
    (productCode !== "VALET" || rueckflugnummer.trim().length > 0);

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...quotePayload,
          rueckflugnummer: rueckflugnummer.trim() || undefined,
          kunde: { name: name.trim(), email: email.trim(), telefon: telefon.trim() || undefined },
          fahrzeug: {
            kennzeichen: kennzeichen.trim(),
            marke: marke.trim() || undefined,
            farbe: farbe.trim() || undefined,
            auffaelligkeiten: auffaelligkeiten.trim() || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Buchung konnte nicht abgeschlossen werden.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.checkoutUrl;
    } catch {
      setSubmitError("Buchung konnte nicht abgeschlossen werden. Bitte erneut versuchen.");
      setSubmitting(false);
    }
  }

  const schritte = ["Zeitraum", "Services", "Ihre Daten", "Übersicht"];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <ol className="mb-8 flex items-center justify-between">
        {schritte.map((label, i) => {
          const nr = i + 1;
          const aktiv = step === nr;
          const erledigt = step > nr;
          return (
            <li key={label} className="flex flex-1 flex-col items-center gap-1.5 text-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  erledigt
                    ? "gold-gradient text-[#1a140a]"
                    : aktiv
                      ? "border border-line-gold text-gold"
                      : "border border-line text-subtle"
                }`}
              >
                {erledigt ? "✓" : nr}
              </div>
              <span className={`text-xs ${aktiv || erledigt ? "text-ink" : "text-subtle"}`}>{label}</span>
            </li>
          );
        })}
      </ol>

      <div className="card p-6 sm:p-8">
        {step === 1 && (
          <div className="space-y-7">
            <div>
              <span className="mb-2.5 block text-sm font-medium text-ink">Produkt</span>
              <div className="grid grid-cols-2 gap-3">
                {(["VALET", "SHUTTLE"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setProductCode(code)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      productCode === code
                        ? "border-line-gold bg-[rgba(200,164,92,0.07)]"
                        : "border-line hover:border-line-gold"
                    }`}
                  >
                    <div className="font-medium text-ink">{code === "VALET" ? "Valet" : "Shuttle"}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      {code === "VALET" ? "Hol & Bring am Terminal" : "Selbstanfahrt, Shuttle zum Terminal"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-ink">Fahrzeugklasse</span>
              <p className="mb-2.5 text-xs leading-relaxed text-muted">
                Der Preis richtet sich nach der Fahrzeuggröße. Bei abweichender Fahrzeuggröße
                behalten wir uns eine Anpassung bei der Übergabe vor.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {vehicleClasses.map((vc) => (
                  <button
                    key={vc.code}
                    type="button"
                    onClick={() => setVehicleClassCode(vc.code)}
                    className={`rounded-xl border p-3 text-center text-sm transition-colors ${
                      vehicleClassCode === vc.code
                        ? "border-line-gold bg-[rgba(200,164,92,0.07)] text-ink"
                        : "border-line text-muted hover:border-line-gold"
                    }`}
                  >
                    {vc.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Anreise (Abgabe)</label>
                <input type="date" min={heuteISO()} value={anreiseDatum} onChange={(e) => setAnreiseDatum(e.target.value)} className="field" />
                <input type="time" value={anreiseZeit} onChange={(e) => setAnreiseZeit(e.target.value)} className="field mt-2" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">Abreise (Abholung)</label>
                <input type="date" min={anreiseDatum || heuteISO()} value={abreiseDatum} onChange={(e) => setAbreiseDatum(e.target.value)} className="field" />
                <input type="time" value={abreiseZeit} onChange={(e) => setAbreiseZeit(e.target.value)} className="field mt-2" />
              </div>
            </div>

            <PreisAnzeige quote={quote} loading={quoteLoading} error={quoteError} />

            <div className="flex justify-end">
              <button type="button" disabled={!schritt1Gueltig} onClick={() => setStep(2)} className="btn-gold">
                Weiter
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <p className="text-sm leading-relaxed text-muted">
              Zusatzservices werden während Ihrer Standzeit bei uns ausgeführt – Sie müssen dafür keinen
              gesonderten Termin wählen.
            </p>
            <div className="space-y-3">
              {addonsList.map((addon) => {
                const gewaehlt = addonCodes.includes(addon.code);
                return (
                  <label
                    key={addon.code}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                      gewaehlt ? "border-line-gold bg-[rgba(200,164,92,0.06)]" : "border-line hover:border-line-gold"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={gewaehlt}
                      onChange={() => toggleAddon(addon.code)}
                      className="mt-1 h-4 w-4 accent-[var(--gold)]"
                    />
                    <div>
                      <div className="font-medium text-ink">
                        {addon.name}
                        {addon.preisCent != null ? (
                          <span className="text-gold"> – {centZuEUR(addon.preisCent)}</span>
                        ) : ""}
                      </div>
                      {addon.description && <div className="mt-0.5 text-xs text-muted">{addon.description}</div>}
                    </div>
                  </label>
                );
              })}
            </div>

            <PreisAnzeige quote={quote} loading={quoteLoading} error={quoteError} />

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-muted transition-colors hover:text-ink">
                ← Zurück
              </button>
              <button type="button" onClick={() => setStep(3)} className="btn-gold">Weiter</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Feld label="Name">
                <input value={name} onChange={(e) => setName(e.target.value)} className="field" />
              </Feld>
              <Feld label="E-Mail">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
              </Feld>
              <Feld label="Telefon (optional)">
                <input value={telefon} onChange={(e) => setTelefon(e.target.value)} className="field" />
              </Feld>
              <Feld label={`Flugnummer Rückflug${productCode === "VALET" ? " *" : " (optional)"}`}>
                <input value={rueckflugnummer} onChange={(e) => setRueckflugnummer(e.target.value)} className="field" placeholder="z. B. LH124" />
                <span className="mt-1 block text-xs text-subtle">Ankunft in Frankfurt – damit Ihr Fahrzeug pünktlich zur Landung bereitsteht.</span>
              </Feld>
              <Feld label="Kennzeichen">
                <input value={kennzeichen} onChange={(e) => setKennzeichen(e.target.value)} className="field" placeholder="z. B. F-AB 1234" />
              </Feld>
              <Feld label="Marke/Modell (optional)">
                <input value={marke} onChange={(e) => setMarke(e.target.value)} className="field" />
              </Feld>
              <Feld label="Farbe (optional)">
                <input value={farbe} onChange={(e) => setFarbe(e.target.value)} className="field" />
              </Feld>
              <Feld label="Gutscheincode (optional)">
                <input value={voucherCode} onChange={(e) => setVoucherCode(e.target.value.toUpperCase())} className="field" />
              </Feld>
            </div>
            <Feld label="Auffälligkeiten am Fahrzeug (optional)">
              <textarea value={auffaelligkeiten} onChange={(e) => setAuffaelligkeiten(e.target.value)} className="field" rows={2} />
            </Feld>

            {voucherCode && quote?.gutschein && !quote.gutschein.gueltig && (
              <p className="text-sm text-[var(--danger)]">{quote.gutschein.grund}</p>
            )}

            <PreisAnzeige quote={quote} loading={quoteLoading} error={quoteError} />

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setStep(2)} className="text-sm font-medium text-muted transition-colors hover:text-ink">
                ← Zurück
              </button>
              <button type="button" disabled={!schritt3Gueltig} onClick={() => setStep(4)} className="btn-gold">
                Weiter zur Übersicht
              </button>
            </div>
          </div>
        )}

        {step === 4 && quote && (
          <div className="space-y-5">
            <h2 className="font-serif text-xl font-semibold text-ink">Übersicht Ihrer Buchung</h2>
            <dl className="space-y-0.5 text-sm">
              <Zeile label="Produkt" wert={productCode === "VALET" ? "Valet – Hol & Bring" : "Shuttle – Selbstanfahrt"} />
              <Zeile label="Fahrzeugklasse" wert={vehicleClasses.find((vc) => vc.code === vehicleClassCode)?.name ?? "–"} />
              <Zeile label="Anreise" wert={`${anreiseDatum} ${anreiseZeit} Uhr`} />
              <Zeile label="Abreise" wert={`${abreiseDatum} ${abreiseZeit} Uhr`} />
              <Zeile label="Tage" wert={String(quote.tage)} />
              <Zeile label="Kunde" wert={`${name} · ${email}`} />
              <Zeile label="Kennzeichen" wert={kennzeichen} />
            </dl>

            <PreisAnzeige quote={quote} loading={quoteLoading} error={quoteError} ausfuehrlich />

            {submitError && <p className="text-sm text-[var(--danger)]">{submitError}</p>}

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setStep(3)} className="text-sm font-medium text-muted transition-colors hover:text-ink">
                ← Zurück
              </button>
              <button
                type="button"
                disabled={submitting || quoteLoading || !quote.verfuegbar}
                onClick={handleSubmit}
                className="btn-gold"
              >
                {submitting ? "Wird verarbeitet…" : "Jetzt kostenpflichtig buchen"}
              </button>
            </div>
            <p className="text-center text-xs text-subtle">
              Sichere Zahlung über Stripe · Kostenlose Stornierung bis 48 Std. vor Anreise
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Feld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

function Zeile({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{wert}</dd>
    </div>
  );
}

function PreisAnzeige({
  quote,
  loading,
  error,
  ausfuehrlich,
}: {
  quote: QuoteResponse | null;
  loading: boolean;
  error: string | null;
  ausfuehrlich?: boolean;
}) {
  if (loading) return <p className="text-sm text-muted">Preis wird berechnet…</p>;
  if (error) return <p className="text-sm text-[var(--danger)]">{error}</p>;
  if (!quote) return null;
  if (!quote.verfuegbar) {
    return (
      <p className="rounded-xl border border-[rgba(217,138,128,0.3)] bg-[rgba(217,138,128,0.08)] p-4 text-sm text-[var(--danger)]">
        Für den gewählten Zeitraum ist leider kein Kontingent mehr frei
        {quote.ausgebuchteTage.length > 0 ? ` (${quote.ausgebuchteTage.join(", ")})` : ""}. Bitte wählen
        Sie einen anderen Zeitraum.
      </p>
    );
  }
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-5 text-sm">
      {ausfuehrlich && (
        <>
          <div className="flex justify-between text-muted">
            <span>Parkgebühr ({quote.tage} Tage)</span>
            <span className="text-ink">{centZuEUR(quote.preisTageCent)}</span>
          </div>
          {quote.addonBreakdown.map((a) => (
            <div key={a.code} className="mt-1.5 flex justify-between text-muted">
              <span>{a.name}</span>
              <span className="text-ink">{centZuEUR(a.preisCent)}</span>
            </div>
          ))}
          {quote.gutscheinRabattCent > 0 && (
            <div className="mt-1.5 flex justify-between text-[var(--success)]">
              <span>Gutschein</span>
              <span>-{centZuEUR(quote.gutscheinRabattCent)}</span>
            </div>
          )}
          <hr className="my-3 border-line" />
        </>
      )}
      <div className="flex items-baseline justify-between">
        <span className="text-ink">Gesamtpreis</span>
        <span className="font-serif text-2xl font-semibold text-gold-gradient">{centZuEUR(quote.preisGesamtCent)}</span>
      </div>
      <div className="mt-1 text-right text-xs text-subtle">inkl. 19 % USt.</div>
    </div>
  );
}
