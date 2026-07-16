import { describe, expect, it } from "vitest";
import { berechneErstattung } from "@/lib/storno";

const basis = { stornoFristStunden: 48, erstattungFruehProzent: 100, erstattungSpaetProzent: 50, betragCent: 20000 };

describe("berechneErstattung", () => {
  it("erstattet 100%, wenn die Stornierung genau 48h oder früher vor Anreise erfolgt", () => {
    expect(berechneErstattung({ ...basis, stundenBisAnreise: 48 })).toEqual({
      erstattungProzent: 100,
      erstattungCent: 20000,
    });
    expect(berechneErstattung({ ...basis, stundenBisAnreise: 72 })).toEqual({
      erstattungProzent: 100,
      erstattungCent: 20000,
    });
  });

  it("erstattet 50%, wenn die Stornierung weniger als 48h vor Anreise erfolgt", () => {
    expect(berechneErstattung({ ...basis, stundenBisAnreise: 47.9 })).toEqual({
      erstattungProzent: 50,
      erstattungCent: 10000,
    });
    expect(berechneErstattung({ ...basis, stundenBisAnreise: 0 })).toEqual({
      erstattungProzent: 50,
      erstattungCent: 10000,
    });
  });

  it("erstattet ebenfalls 50%, wenn nach der Anreise storniert wird (negative Stunden)", () => {
    expect(berechneErstattung({ ...basis, stundenBisAnreise: -5 }).erstattungProzent).toBe(50);
  });

  it("rundet den Erstattungsbetrag auf ganze Cent", () => {
    const { erstattungCent } = berechneErstattung({
      ...basis,
      betragCent: 9999,
      stundenBisAnreise: 10,
    });
    expect(erstattungCent).toBe(Math.round(9999 * 0.5));
  });

  it("respektiert eine im Admin geänderte Frist (z. B. 24h)", () => {
    expect(
      berechneErstattung({ ...basis, stornoFristStunden: 24, stundenBisAnreise: 30 }).erstattungProzent
    ).toBe(100);
    expect(
      berechneErstattung({ ...basis, stornoFristStunden: 24, stundenBisAnreise: 10 }).erstattungProzent
    ).toBe(50);
  });
});
