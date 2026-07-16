import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { gibKapazitaetFrei, KapazitaetError, reserviereKapazitaet, verfuegbareTage } from "@/lib/capacity";
import { ProductCode } from "@/generated/prisma/client";

// Integrationstest gegen die echte (lokale) Postgres-Datenbank – benötigt eine
// laufende Datenbank mit angewendeten Migrationen (siehe README "Lokales Setup").
// Es werden ausschließlich Testtage weit in der Zukunft (2099) verwendet, damit
// echte Kapazitätsdaten nicht beeinflusst werden.

let productId: string;
const testTage = [
  new Date(Date.UTC(2099, 0, 1)),
  new Date(Date.UTC(2099, 0, 2)),
  new Date(Date.UTC(2099, 0, 3)),
];

beforeAll(async () => {
  const product = await prisma.product.findUniqueOrThrow({ where: { code: ProductCode.VALET } });
  productId = product.id;

  for (const date of testTage) {
    await prisma.capacityDay.upsert({
      where: { productId_date: { productId, date } },
      update: { kontingent: 1, belegt: 0 },
      create: { productId, date, kontingent: 1, belegt: 0 },
    });
  }
});

afterAll(async () => {
  await prisma.capacityDay.deleteMany({ where: { productId, date: { in: testTage } } });
  await prisma.$disconnect();
});

describe("Kapazitätslogik – harter Überbuchungsschutz", () => {
  it("reserviert erfolgreich, wenn ein Platz frei ist", async () => {
    await prisma.$transaction((tx) => reserviereKapazitaet(tx, productId, [testTage[0]]));
    const row = await prisma.capacityDay.findUniqueOrThrow({
      where: { productId_date: { productId, date: testTage[0] } },
    });
    expect(row.belegt).toBe(1);
  });

  it("lehnt eine zweite Reservierung ab, wenn das Kontingent (1) bereits ausgeschöpft ist", async () => {
    await expect(
      prisma.$transaction((tx) => reserviereKapazitaet(tx, productId, [testTage[0]]))
    ).rejects.toThrow(KapazitaetError);
  });

  it("meldet den Zeitraum als nicht verfügbar, sobald ein Tag ausgebucht ist", async () => {
    const { verfuegbar, ausgebuchteTage } = await verfuegbareTage(productId, [
      testTage[0],
      testTage[1],
    ]);
    expect(verfuegbar).toBe(false);
    expect(ausgebuchteTage).toHaveLength(1);
  });

  it("verhindert Überbuchung auch bei gleichzeitigen (parallelen) Anfragen auf den letzten Platz", async () => {
    // testTage[1] hat kontingent=1, belegt=0 – zwei parallele Buchungsversuche
    // dürfen niemals beide erfolgreich sein.
    const versuch = () => prisma.$transaction((tx) => reserviereKapazitaet(tx, productId, [testTage[1]]));

    const ergebnisse = await Promise.allSettled([versuch(), versuch()]);
    const erfolgreich = ergebnisse.filter((r) => r.status === "fulfilled");
    const abgelehnt = ergebnisse.filter((r) => r.status === "rejected");

    expect(erfolgreich).toHaveLength(1);
    expect(abgelehnt).toHaveLength(1);

    const row = await prisma.capacityDay.findUniqueOrThrow({
      where: { productId_date: { productId, date: testTage[1] } },
    });
    expect(row.belegt).toBe(1);
  });

  it("gibt Kapazität nach Storno wieder frei", async () => {
    await prisma.$transaction((tx) => gibKapazitaetFrei(tx, productId, [testTage[0]]));
    const row = await prisma.capacityDay.findUniqueOrThrow({
      where: { productId_date: { productId, date: testTage[0] } },
    });
    expect(row.belegt).toBe(0);

    await prisma.$transaction((tx) => reserviereKapazitaet(tx, productId, [testTage[0]]));
    const row2 = await prisma.capacityDay.findUniqueOrThrow({
      where: { productId_date: { productId, date: testTage[0] } },
    });
    expect(row2.belegt).toBe(1);
  });
});
