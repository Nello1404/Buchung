import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getMonatsuebersicht } from "@/lib/finance";

// Testmonat weit in der Zukunft (2099-04), damit echte Daten unberührt bleiben.
const jahr = 2099;
const monat = 4;
let categoryId: string;
const ids: string[] = [];

beforeAll(async () => {
  const cat = await prisma.expenseCategory.upsert({
    where: { name: "Testkategorie-Finance" },
    update: {},
    create: { name: "Testkategorie-Finance", sortOrder: 99 },
  });
  categoryId = cat.id;
  for (const [tag, betrag] of [[3, 10000], [10, 5000], [20, 2500]] as const) {
    const e = await prisma.expense.create({
      data: { datum: new Date(Date.UTC(jahr, monat - 1, tag)), betragCent: betrag, categoryId, erfasstVon: "test" },
    });
    ids.push(e.id);
  }
});

afterAll(async () => {
  await prisma.expense.deleteMany({ where: { id: { in: ids } } });
  await prisma.expenseCategory.deleteMany({ where: { id: categoryId } });
  await prisma.$disconnect();
});

describe("getMonatsuebersicht", () => {
  it("summiert Ausgaben und berechnet Ergebnis + Rücklage", async () => {
    const u = await getMonatsuebersicht(jahr, monat);
    expect(u.ausgabenCent).toBe(17500); // 100 + 50 + 25 EUR
    // keine Einnahmen in 2099-04 → Ergebnis negativ
    expect(u.ergebnisCent).toBe(u.einnahmenCent - 17500);
    // Rücklage nur auf positives Ergebnis; hier Ergebnis < 0 → Rücklage 0
    if (u.ergebnisCent <= 0) expect(u.ruecklageCent).toBe(0);
    // Kategorie-Summe stimmt
    const kat = u.kategorien.find((k) => k.name === "Testkategorie-Finance");
    expect(kat?.betragCent).toBe(17500);
  });
});
