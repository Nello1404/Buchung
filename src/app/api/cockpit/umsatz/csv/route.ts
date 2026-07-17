import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { aufloesenZeitraum, berechneUmsatz, type Preset } from "@/lib/revenue";

const presets: Preset[] = ["tag", "woche", "monat", "jahr", "custom"];

function eur(cent: number): string {
  return (cent / 100).toFixed(2).replace(".", ",");
}

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;

  const sp = new URL(request.url).searchParams;
  const presetParam = sp.get("preset") ?? "monat";
  const preset = (presets.includes(presetParam as Preset) ? presetParam : "monat") as Preset;
  const { von, bis, granularitaet } = aufloesenZeitraum(preset, sp.get("von") ?? undefined, sp.get("bis") ?? undefined);
  const r = await berechneUmsatz(von, bis, granularitaet);

  const zeilen: string[] = [];
  zeilen.push("FlySpot Valet – Umsatzauswertung");
  zeilen.push(`Zeitraum;${r.von.slice(0, 10)};${r.bis.slice(0, 10)}`);
  zeilen.push("");
  zeilen.push("Kennzahl;Wert");
  zeilen.push(`Brutto-Umsatz (EUR);${eur(r.bruttoCent)}`);
  zeilen.push(`Erstattungen (EUR);${eur(r.erstattetCent)}`);
  zeilen.push(`Netto nach Storno (EUR);${eur(r.nettoNachStornoCent)}`);
  zeilen.push(`Netto (ohne USt) (EUR);${eur(r.ustAusweis.nettoCent)}`);
  zeilen.push(`USt 19% (EUR);${eur(r.ustAusweis.ustCent)}`);
  zeilen.push(`Anzahl Buchungen;${r.kennzahlen.anzahlBuchungen}`);
  zeilen.push(`Stornoquote (%);${r.kennzahlen.stornoquoteProzent}`);
  zeilen.push(`Ø Erlös je Fahrzeug-Tag (EUR);${eur(r.kennzahlen.oErloesProFahrzeugTagCent)}`);
  zeilen.push(`Ø Buchungsdauer (Tage);${String(r.kennzahlen.oBuchungsdauerTage).replace(".", ",")}`);
  zeilen.push(`Ø Zusatzservice-Warenkorb (EUR);${eur(r.kennzahlen.oAddonWarenkorbCent)}`);
  zeilen.push("");
  zeilen.push("Umsatz nach Quelle;EUR");
  for (const q of r.quellen) zeilen.push(`${q.quelle};${eur(q.betragCent)}`);
  zeilen.push("");
  zeilen.push("Verlauf;EUR");
  for (const p of r.zeitreihe) zeilen.push(`${p.bucket};${eur(p.betragCent)}`);

  const csv = "﻿" + zeilen.join("\r\n"); // BOM für Excel
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="umsatz-${r.von.slice(0, 10)}_${r.bis.slice(0, 10)}.csv"`,
    },
  });
}
