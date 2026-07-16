"use client";

import { useEffect, useMemo, useState } from "react";
import { centZuEUR } from "@/lib/format";

type ProductCode = "VALET" | "SHUTTLE";

interface Addon {
  code: string;
  name: string;
  description: string | null;
  preisCent: number;
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
  const [flugnummer, setFlugnummer] = useState("");
  const [voucherCode, setVoucherCode] = useState("");

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/service-addons")
      .then((r) => r.json())
      .then((d) => setAddonsList(d.addons ?? []))
      .catch(() => setAddonsList([]));
  }, []);

  const quotePayload = useMemo(
    () => ({
      productCode,
      anreiseDatum,
      anreiseZeit,
      abreiseDatum,
      abreiseZeit,
      addonCodes,
      voucherCode: voucherCode.trim() || undefined,
      customerEmail: email.trim() || undefined,
    }),
    [productCode, anreiseDatum, anreiseZeit, abreiseDatum, abreiseZeit, addonCodes, voucherCode, email]
  );

  useEffect(() => {
    if (!anreiseDatum || !abreiseDatum) return;
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
  }, [quotePayload, anreiseDatum, abreiseDatum]);

  function toggleAddon(code: string) {
    setAddonCodes((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  const schritt1Gueltig =
    !!anreiseDatum && !!abreiseDatum && !quoteLoading && !quoteError && !!quote?.verfuegbar;

  const schritt3Gueltig =
    name.trim().length > 1 &&
    /\S+@\S+\.\S+/.test(email) &&
    kennzeichen.trim().length > 1 &&
    (productCode !== "VALET" || flugnummer.trim().length > 0);

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...quotePayload,
          flugnummer: flugnummer.trim() || undefined,
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

  return (
    <div className="mx-auto w-full max-w-2xl">
      <ol className="mb-8 flex justify-between text-xs font-medium text-zinc-500">
        {["Zeitraum", "Zusatzservices", "Kundendaten", "Zusammenfassung"].map((label, i) => (
          <li key={label} className={`flex-1 text-center ${step === i + 1 ? "text-blue-900 dark:text-blue-300" : ""}`}>
            <div
              className={`mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full text-white ${
                step > i + 1 ? "bg-green-600" : step === i + 1 ? "bg-blue-900" : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              {i + 1}
            </div>
            {label}
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <span className="mb-2 block text-sm font-medium">Produkt</span>
              <div className="grid grid-cols-2 gap-3">
                {(["VALET", "SHUTTLE"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setProductCode(code)}
                    className={`rounded-lg border p-4 text-left transition-colors ${
                      productCode === code
                        ? "border-blue-900 bg-blue-50 dark:bg-blue-950"
                        : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <div className="font-semibold">{code === "VALET" ? "Valet" : "Shuttle"}</div>
                    <div className="text-xs text-zinc-500">
                      {code === "VALET" ? "Hol & Bring am Terminal" : "Selbstanfahrt, Shuttle zum Terminal"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Anreise (Abgabe)</label>
                <input
                  type="date"
                  min={heuteISO()}
                  value={anreiseDatum}
                  onChange={(e) => setAnreiseDatum(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
                <input
                  type="time"
                  value={anreiseZeit}
                  onChange={(e) => setAnreiseZeit(e.target.value)}
                  className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Abreise (Abholung)</label>
                <input
                  type="date"
                  min={anreiseDatum || heuteISO()}
                  value={abreiseDatum}
                  onChange={(e) => setAbreiseDatum(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
                <input
                  type="time"
                  value={abreiseZeit}
                  onChange={(e) => setAbreiseZeit(e.target.value)}
                  className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
            </div>

            <PreisAnzeige quote={quote} loading={quoteLoading} error={quoteError} />

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!schritt1Gueltig}
                onClick={() => setStep(2)}
                className="rounded-full bg-blue-900 px-6 py-2 font-semibold text-white disabled:opacity-40"
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Zusatzservices werden während Ihrer Standzeit bei uns ausgeführt – Sie müssen dafür keinen
              gesonderten Termin wählen.
            </p>
            <div className="space-y-3">
              {addonsList.map((addon) => (
                <label
                  key={addon.code}
                  className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                >
                  <input
                    type="checkbox"
                    checked={addonCodes.includes(addon.code)}
                    onChange={() => toggleAddon(addon.code)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">
                      {addon.name} – {centZuEUR(addon.preisCent)}
                    </div>
                    {addon.description && (
                      <div className="text-xs text-zinc-500">{addon.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <PreisAnzeige quote={quote} loading={quoteLoading} error={quoteError} />

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-zinc-600">
                Zurück
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-full bg-blue-900 px-6 py-2 font-semibold text-white"
              >
                Weiter
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Feld label="Name">
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
              </Feld>
              <Feld label="E-Mail">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                />
              </Feld>
              <Feld label="Telefon (optional)">
                <input value={telefon} onChange={(e) => setTelefon(e.target.value)} className={inputCls} />
              </Feld>
              <Feld label={`Flugnummer${productCode === "VALET" ? " *" : " (optional)"}`}>
                <input
                  value={flugnummer}
                  onChange={(e) => setFlugnummer(e.target.value)}
                  className={inputCls}
                  placeholder="z. B. LH123"
                />
              </Feld>
              <Feld label="Kennzeichen">
                <input
                  value={kennzeichen}
                  onChange={(e) => setKennzeichen(e.target.value)}
                  className={inputCls}
                  placeholder="z. B. F-AB 1234"
                />
              </Feld>
              <Feld label="Marke/Modell (optional)">
                <input value={marke} onChange={(e) => setMarke(e.target.value)} className={inputCls} />
              </Feld>
              <Feld label="Farbe (optional)">
                <input value={farbe} onChange={(e) => setFarbe(e.target.value)} className={inputCls} />
              </Feld>
              <Feld label="Gutscheincode (optional)">
                <input
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  className={inputCls}
                />
              </Feld>
            </div>
            <Feld label="Auffälligkeiten am Fahrzeug (optional)">
              <textarea
                value={auffaelligkeiten}
                onChange={(e) => setAuffaelligkeiten(e.target.value)}
                className={inputCls}
                rows={2}
              />
            </Feld>

            {voucherCode && quote?.gutschein && !quote.gutschein.gueltig && (
              <p className="text-sm text-red-600">{quote.gutschein.grund}</p>
            )}

            <PreisAnzeige quote={quote} loading={quoteLoading} error={quoteError} />

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(2)} className="text-sm font-medium text-zinc-600">
                Zurück
              </button>
              <button
                type="button"
                disabled={!schritt3Gueltig}
                onClick={() => setStep(4)}
                className="rounded-full bg-blue-900 px-6 py-2 font-semibold text-white disabled:opacity-40"
              >
                Weiter zur Zusammenfassung
              </button>
            </div>
          </div>
        )}

        {step === 4 && quote && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Zusammenfassung</h2>
            <dl className="space-y-1 text-sm">
              <Zeile label="Produkt" wert={productCode === "VALET" ? "Valet" : "Shuttle"} />
              <Zeile label="Anreise" wert={`${anreiseDatum} ${anreiseZeit} Uhr`} />
              <Zeile label="Abreise" wert={`${abreiseDatum} ${abreiseZeit} Uhr`} />
              <Zeile label="Tage" wert={String(quote.tage)} />
              <Zeile label="Kunde" wert={`${name} · ${email}`} />
              <Zeile label="Kennzeichen" wert={kennzeichen} />
            </dl>

            <PreisAnzeige quote={quote} loading={quoteLoading} error={quoteError} ausfuehrlich />

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(3)} className="text-sm font-medium text-zinc-600">
                Zurück
              </button>
              <button
                type="button"
                disabled={submitting || quoteLoading || !quote.verfuegbar}
                onClick={handleSubmit}
                className="rounded-full bg-blue-900 px-8 py-3 font-semibold text-white disabled:opacity-40"
              >
                {submitting ? "Wird verarbeitet…" : "Jetzt kostenpflichtig buchen"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800";

function Feld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
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
  if (loading) return <p className="text-sm text-zinc-500">Preis wird berechnet…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!quote) return null;
  if (!quote.verfuegbar) {
    return (
      <p className="text-sm text-red-600">
        Für den gewählten Zeitraum ist leider kein Kontingent mehr frei
        {quote.ausgebuchteTage.length > 0 ? ` (${quote.ausgebuchteTage.join(", ")})` : ""}. Bitte wählen
        Sie einen anderen Zeitraum.
      </p>
    );
  }
  return (
    <div className="rounded-lg bg-zinc-50 p-4 text-sm dark:bg-zinc-800">
      {ausfuehrlich && (
        <>
          <div className="flex justify-between">
            <span>Parkgebühr ({quote.tage} Tage)</span>
            <span>{centZuEUR(quote.preisTageCent)}</span>
          </div>
          {quote.addonBreakdown.map((a) => (
            <div key={a.code} className="flex justify-between text-zinc-500">
              <span>{a.name}</span>
              <span>{centZuEUR(a.preisCent)}</span>
            </div>
          ))}
          {quote.gutscheinRabattCent > 0 && (
            <div className="flex justify-between text-green-700 dark:text-green-400">
              <span>Gutschein</span>
              <span>-{centZuEUR(quote.gutscheinRabattCent)}</span>
            </div>
          )}
          <hr className="my-2 border-zinc-300 dark:border-zinc-600" />
        </>
      )}
      <div className="flex justify-between text-base font-semibold">
        <span>Gesamtpreis</span>
        <span>{centZuEUR(quote.preisGesamtCent)}</span>
      </div>
      <div className="mt-1 text-xs text-zinc-500">inkl. 19 % USt.</div>
    </div>
  );
}
