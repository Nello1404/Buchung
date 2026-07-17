import { describe, expect, it } from "vitest";
import {
  berechnePreis,
  findeTarifRegel,
  gutscheinWertCent,
  SperrtagError,
  ustAusweis,
  type TariffRuleInput,
} from "@/lib/pricing";

const valetRules: TariffRuleInput[] = [
  { minTage: 1, maxTage: 3, preisProTagCent: 4500 },
  { minTage: 4, maxTage: 7, preisProTagCent: 3900 },
  { minTage: 8, maxTage: 14, preisProTagCent: 3300 },
  { minTage: 15, maxTage: null, preisProTagCent: 2700 },
];

const shuttleRules: TariffRuleInput[] = [
  { minTage: 1, maxTage: 3, preisProTagCent: 2100 },
  { minTage: 4, maxTage: 7, preisProTagCent: 1800 },
  { minTage: 8, maxTage: 14, preisProTagCent: 1500 },
  { minTage: 15, maxTage: null, preisProTagCent: 1200 },
];

function d(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`);
}

describe("findeTarifRegel", () => {
  it.each([
    [1, 4500],
    [3, 4500],
    [4, 3900],
    [7, 3900],
    [8, 3300],
    [14, 3300],
    [15, 2700],
    [30, 2700],
  ])("wählt für %i Tage die richtige Staffel (Valet)", (tage, erwarteterPreis) => {
    expect(findeTarifRegel(valetRules, tage)?.preisProTagCent).toBe(erwarteterPreis);
  });
});

describe("berechnePreis – Staffelpreise", () => {
  it("berechnet 3 Tage Valet (1-3 Tage-Staffel)", () => {
    const ergebnis = berechnePreis({
      anreise: d("2026-01-10"),
      abreise: d("2026-01-13"),
      tariffRules: valetRules,
      seasonRates: [],
      blockedDays: [],
      addons: [],
    });
    expect(ergebnis.tage).toBe(3);
    expect(ergebnis.preisTageCent).toBe(3 * 4500);
    expect(ergebnis.preisGesamtCent).toBe(3 * 4500);
  });

  it("berechnet 10 Tage Shuttle (8-14 Tage-Staffel)", () => {
    const ergebnis = berechnePreis({
      anreise: d("2026-01-10"),
      abreise: d("2026-01-20"),
      tariffRules: shuttleRules,
      seasonRates: [],
      blockedDays: [],
      addons: [],
    });
    expect(ergebnis.tage).toBe(10);
    expect(ergebnis.preisTageCent).toBe(10 * 1500);
  });

  it("berechnet 20 Tage Valet (offene 15+ Staffel)", () => {
    const ergebnis = berechnePreis({
      anreise: d("2026-01-10"),
      abreise: d("2026-01-30"),
      tariffRules: valetRules,
      seasonRates: [],
      blockedDays: [],
      addons: [],
    });
    expect(ergebnis.tage).toBe(20);
    expect(ergebnis.preisTageCent).toBe(20 * 2700);
  });

  it("wirft Fehler, wenn keine Staffel den Zeitraum abdeckt", () => {
    const luecke = [{ minTage: 1, maxTage: 3, preisProTagCent: 1000 }];
    expect(() =>
      berechnePreis({
        anreise: d("2026-01-10"),
        abreise: d("2026-01-15"),
        tariffRules: luecke,
        seasonRates: [],
        blockedDays: [],
        addons: [],
      })
    ).toThrow();
  });
});

describe("berechnePreis – Saison-Aufschlag", () => {
  it("ersetzt den Staffelpreis für Tage innerhalb der Saison durch den Saisonpreis", () => {
    const ergebnis = berechnePreis({
      anreise: d("2026-07-01"),
      abreise: d("2026-07-04"), // 3 Tage, alle in der Saison
      tariffRules: valetRules,
      seasonRates: [
        { startDate: d("2026-06-27"), endDate: d("2026-08-04"), preisProTagCent: 5500 },
      ],
      blockedDays: [],
      addons: [],
    });
    expect(ergebnis.tagesliste.every((t) => t.saison)).toBe(true);
    expect(ergebnis.preisTageCent).toBe(3 * 5500);
  });

  it("wendet einen prozentualen Saison-Zuschlag auf den Staffelpreis an", () => {
    const ergebnis = berechnePreis({
      anreise: d("2026-07-01"),
      abreise: d("2026-07-04"), // 3 Tage, Staffel 1-3 = 4500/Tag
      tariffRules: valetRules,
      seasonRates: [{ startDate: d("2026-06-27"), endDate: d("2026-08-04"), zuschlagProzent: 20 }],
      blockedDays: [],
      addons: [],
    });
    // 4500 + 20% = 5400 pro Tag
    expect(ergebnis.tagesliste.every((t) => t.saison)).toBe(true);
    expect(ergebnis.preisTageCent).toBe(3 * 5400);
  });

  it("berechnet gemischte Zeiträume tageweise (teils Saison, teils regulär)", () => {
    const ergebnis = berechnePreis({
      anreise: d("2026-08-02"),
      abreise: d("2026-08-06"), // 4 Tage: 08-02, 08-03, 08-04 in Saison, 08-05 regulär
      tariffRules: valetRules,
      seasonRates: [
        { startDate: d("2026-06-27"), endDate: d("2026-08-04"), preisProTagCent: 5500 },
      ],
      blockedDays: [],
      addons: [],
    });
    expect(ergebnis.tage).toBe(4);
    const saisonTage = ergebnis.tagesliste.filter((t) => t.saison).length;
    expect(saisonTage).toBe(3);
    expect(ergebnis.preisTageCent).toBe(3 * 5500 + 1 * 3900);
  });
});

describe("berechnePreis – Sperrtage", () => {
  it("wirft SperrtagError, wenn ein Tag im Zeitraum gesperrt ist", () => {
    expect(() =>
      berechnePreis({
        anreise: d("2026-01-10"),
        abreise: d("2026-01-13"),
        tariffRules: valetRules,
        seasonRates: [],
        blockedDays: [{ date: d("2026-01-11") }],
        addons: [],
      })
    ).toThrow(SperrtagError);
  });
});

describe("berechnePreis – Zusatzservices", () => {
  it("addiert ausgewählte Zusatzservices einmalig zum Gesamtpreis", () => {
    const ergebnis = berechnePreis({
      anreise: d("2026-01-10"),
      abreise: d("2026-01-13"),
      tariffRules: valetRules,
      seasonRates: [],
      blockedDays: [],
      addons: [
        { code: "kleine-aufbereitung", name: "Kleine Aufbereitung", preisCent: 3900 },
        { code: "tankservice", name: "Tankservice", preisCent: 900 },
      ],
    });
    expect(ergebnis.preisAddonsCent).toBe(3900 + 900);
    expect(ergebnis.preisGesamtCent).toBe(3 * 4500 + 3900 + 900);
  });
});

describe("Gutschein '1 Tag gratis'", () => {
  it("entspricht dem Tagespreis der Langzeit-Staffel (>7 Tage) des Produkts", () => {
    expect(gutscheinWertCent(valetRules)).toBe(3300);
    expect(gutscheinWertCent(shuttleRules)).toBe(1500);
  });

  it("wird unabhängig von der tatsächlichen (kurzen) Aufenthaltsdauer in voller Höhe abgezogen", () => {
    const ergebnis = berechnePreis({
      anreise: d("2026-01-10"),
      abreise: d("2026-01-12"), // 2 Tage à 4500 = 9000
      tariffRules: valetRules,
      seasonRates: [],
      blockedDays: [],
      addons: [],
      gutscheinAnwenden: true,
    });
    expect(ergebnis.gutscheinRabattCent).toBe(3300);
    expect(ergebnis.preisGesamtCent).toBe(9000 - 3300);
  });

  it("kappt den Rabatt bei sehr kurzen/günstigen Aufenthalten auf den Tagespreis (nie negativ)", () => {
    const kurzeRegeln: TariffRuleInput[] = [
      { minTage: 1, maxTage: 3, preisProTagCent: 1000 },
      { minTage: 8, maxTage: null, preisProTagCent: 3300 },
    ];
    const ergebnis = berechnePreis({
      anreise: d("2026-01-10"),
      abreise: d("2026-01-11"), // 1 Tag à 1000
      tariffRules: kurzeRegeln,
      seasonRates: [],
      blockedDays: [],
      addons: [],
      gutscheinAnwenden: true,
    });
    expect(ergebnis.preisTageCent).toBe(1000);
    expect(ergebnis.gutscheinRabattCent).toBe(1000);
    expect(ergebnis.preisGesamtCent).toBe(0);
  });
});

describe("ustAusweis", () => {
  it("weist 19% USt korrekt aus", () => {
    const { nettoCent, ustCent, bruttoCent } = ustAusweis(11900);
    expect(bruttoCent).toBe(11900);
    expect(nettoCent + ustCent).toBe(bruttoCent);
    expect(nettoCent).toBe(10000);
    expect(ustCent).toBe(1900);
  });
});
