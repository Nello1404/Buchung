import { anzahlTage, belegteTage, liegtImZeitraum } from "@/lib/date";

export class SperrtagError extends Error {
  constructor(public readonly datum: Date) {
    super(`Zeitraum enthält einen Sperrtag: ${datum.toISOString().slice(0, 10)}`);
    this.name = "SperrtagError";
  }
}

export class KeinTarifError extends Error {
  constructor(public readonly tage: number) {
    super(`Kein Tarif für ${tage} Tage hinterlegt.`);
    this.name = "KeinTarifError";
  }
}

export interface TariffRuleInput {
  minTage: number;
  maxTage: number | null;
  preisProTagCent: number;
}

export interface SeasonRateInput {
  startDate: Date;
  endDate: Date;
  /** Fester Tagespreis (ersetzt den Staffelpreis), falls gesetzt. */
  preisProTagCent?: number | null;
  /** Prozentualer Zuschlag auf den Staffelpreis (z. B. 20 = +20 %), falls gesetzt. */
  zuschlagProzent?: number | null;
}

export interface BlockedDayInput {
  date: Date;
}

export interface AddonInput {
  code: string;
  name: string;
  preisCent: number;
}

export interface TagespreisEintrag {
  datum: Date;
  preisCent: number;
  saison: boolean;
}

export type GutscheinTyp = "TAG_GRATIS" | "PROZENT" | "BETRAG";

export interface GutscheinInput {
  typ: GutscheinTyp;
  /** PROZENT: Prozentsatz; BETRAG: Cent; TAG_GRATIS: ungenutzt. */
  wert: number;
}

export interface PreisBerechnungParams {
  anreise: Date;
  abreise: Date;
  tariffRules: TariffRuleInput[];
  seasonRates: SeasonRateInput[];
  blockedDays: BlockedDayInput[];
  addons: AddonInput[];
  /** Anzuwendender Gutschein (Gültigkeit/Einlösbarkeit prüft der Aufrufer). */
  gutschein?: GutscheinInput | null;
}

export interface PreisBerechnungErgebnis {
  tage: number;
  tagesliste: TagespreisEintrag[];
  preisTageCent: number;
  preisAddonsCent: number;
  gutscheinRabattCent: number;
  preisGesamtCent: number;
  addonBreakdown: { code: string; name: string; preisCent: number }[];
}

/** Findet die Staffel-Regel, die für die gegebene Aufenthaltsdauer (in vollen Tagen) gilt. */
export function findeTarifRegel(
  regeln: TariffRuleInput[],
  tage: number
): TariffRuleInput | undefined {
  return regeln.find(
    (r) => tage >= r.minTage && (r.maxTage === null || tage <= r.maxTage)
  );
}

/**
 * Tagespreis für einen einzelnen Kalendertag: Saison-Preis, falls der Tag in einem
 * Saison-Zeitraum liegt (ersetzt den Staffelpreis komplett), sonst der reguläre
 * Staffelpreis für die Gesamt-Aufenthaltsdauer.
 */
function tagespreis(
  datum: Date,
  gesamtTage: number,
  tariffRules: TariffRuleInput[],
  seasonRates: SeasonRateInput[]
): TagespreisEintrag {
  const regel = findeTarifRegel(tariffRules, gesamtTage);
  const season = seasonRates.find((s) => liegtImZeitraum(datum, s.startDate, s.endDate));

  if (season) {
    // Fester Saison-Tagespreis hat Vorrang, wenn gesetzt.
    if (season.preisProTagCent != null) {
      return { datum, preisCent: season.preisProTagCent, saison: true };
    }
    // Prozentualer Zuschlag auf den Staffelpreis.
    if (season.zuschlagProzent != null) {
      if (!regel) throw new KeinTarifError(gesamtTage);
      return {
        datum,
        preisCent: Math.round(regel.preisProTagCent * (1 + season.zuschlagProzent / 100)),
        saison: true,
      };
    }
  }

  if (!regel) {
    throw new KeinTarifError(gesamtTage);
  }
  return { datum, preisCent: regel.preisProTagCent, saison: false };
}

/**
 * Wert des Treue-Gutscheins "1 Tag gratis": der Tagespreis der Langzeit-Staffel
 * (>7 Tage) des jeweils gebuchten Produkts – unabhängig von der tatsächlichen
 * Aufenthaltsdauer der neuen Buchung.
 */
export function gutscheinWertCent(tariffRules: TariffRuleInput[]): number {
  const regel = findeTarifRegel(tariffRules, 8);
  if (!regel) {
    throw new KeinTarifError(8);
  }
  return regel.preisProTagCent;
}

export function berechnePreis(params: PreisBerechnungParams): PreisBerechnungErgebnis {
  const { anreise, abreise, tariffRules, seasonRates, blockedDays, addons } = params;

  const tage = anzahlTage(anreise, abreise);
  const tageListe = belegteTage(anreise, abreise);

  for (const tag of tageListe) {
    const gesperrt = blockedDays.find((b) => b.date.getTime() === tag.getTime());
    if (gesperrt) {
      throw new SperrtagError(tag);
    }
  }

  const tagesliste = tageListe.map((tag) => tagespreis(tag, tage, tariffRules, seasonRates));
  const preisTageCent = tagesliste.reduce((sum, t) => sum + t.preisCent, 0);

  const addonBreakdown = addons.map((a) => ({ code: a.code, name: a.name, preisCent: a.preisCent }));
  const preisAddonsCent = addonBreakdown.reduce((sum, a) => sum + a.preisCent, 0);

  const zwischensumme = preisTageCent + preisAddonsCent;
  let gutscheinRabattCent = 0;
  if (params.gutschein) {
    const g = params.gutschein;
    if (g.typ === "TAG_GRATIS") {
      gutscheinRabattCent = Math.min(gutscheinWertCent(tariffRules), preisTageCent);
    } else if (g.typ === "PROZENT") {
      gutscheinRabattCent = Math.min(Math.round((zwischensumme * g.wert) / 100), zwischensumme);
    } else if (g.typ === "BETRAG") {
      gutscheinRabattCent = Math.min(g.wert, zwischensumme);
    }
  }

  const preisGesamtCent = Math.max(zwischensumme - gutscheinRabattCent, 0);

  return {
    tage,
    tagesliste,
    preisTageCent,
    preisAddonsCent,
    gutscheinRabattCent,
    preisGesamtCent,
    addonBreakdown,
  };
}

/** USt-Ausweis (19 %) für einen Bruttobetrag – Rundung auf ganze Cent. */
export function ustAusweis(bruttoCent: number, satz = 0.19) {
  const nettoCent = Math.round(bruttoCent / (1 + satz));
  const ustCent = bruttoCent - nettoCent;
  return { bruttoCent, nettoCent, ustCent, satz };
}
