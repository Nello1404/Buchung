import { berechneUmsatz } from "@/lib/revenue";
import { berlinKalendertag } from "@/lib/date";

export interface WochenreportDaten {
  vonISO: string; // Montag der Vorwoche (inkl.)
  bisISO: string; // Sonntag der Vorwoche (inkl.)
  bruttoCent: number;
  erstattetCent: number;
  nettoNachStornoCent: number;
  anzahlBuchungen: number;
  stornierteAnzahl: number;
  stornoquoteProzent: number;
  oErloesProFahrzeugTagCent: number;
  oBuchungsdauerTage: number;
  vorwocheBruttoCent: number;
  /// Veränderung Brutto ggü. Vorwoche in Prozent (null, wenn Vorwoche = 0).
  veraenderungProzent: number | null;
}

/**
 * Stellt die Kennzahlen der letzten abgeschlossenen Kalenderwoche (Mo–So)
 * zusammen. Als Vergleich dient die Woche davor.
 */
export async function baueWochenreportDaten(stichtag = new Date()): Promise<WochenreportDaten> {
  const heute = berlinKalendertag(stichtag);
  const day = heute.getUTCDay() || 7; // Mo=1 … So=7

  // Montag dieser Woche → minus 7 Tage = Montag der Vorwoche.
  const montagDiese = new Date(heute);
  montagDiese.setUTCDate(montagDiese.getUTCDate() - day + 1);

  const von = new Date(montagDiese);
  von.setUTCDate(von.getUTCDate() - 7); // Montag Vorwoche (inkl.)
  const bis = new Date(montagDiese); // Montag diese Woche (exkl.) = Sonntag Vorwoche inkl.

  const vorVon = new Date(von);
  vorVon.setUTCDate(vorVon.getUTCDate() - 7);

  const [umsatz, vergleich] = await Promise.all([
    berechneUmsatz(von, bis, "tag"),
    berechneUmsatz(vorVon, von, "tag"),
  ]);

  const bisInklusive = new Date(bis);
  bisInklusive.setUTCDate(bisInklusive.getUTCDate() - 1);

  const veraenderungProzent =
    vergleich.bruttoCent > 0
      ? Math.round(((umsatz.bruttoCent - vergleich.bruttoCent) / vergleich.bruttoCent) * 100)
      : null;

  return {
    vonISO: von.toISOString().slice(0, 10),
    bisISO: bisInklusive.toISOString().slice(0, 10),
    bruttoCent: umsatz.bruttoCent,
    erstattetCent: umsatz.erstattetCent,
    nettoNachStornoCent: umsatz.nettoNachStornoCent,
    anzahlBuchungen: umsatz.kennzahlen.anzahlBuchungen,
    stornierteAnzahl: umsatz.kennzahlen.stornierteAnzahl,
    stornoquoteProzent: umsatz.kennzahlen.stornoquoteProzent,
    oErloesProFahrzeugTagCent: umsatz.kennzahlen.oErloesProFahrzeugTagCent,
    oBuchungsdauerTage: umsatz.kennzahlen.oBuchungsdauerTage,
    vorwocheBruttoCent: vergleich.bruttoCent,
    veraenderungProzent,
  };
}
