import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { berechneUmsatz } from "@/lib/revenue";
import { ProductCode } from "@/generated/prisma/client";

// Testfenster im Jahr 2099, damit echte Daten unberührt bleiben.
const von = new Date(Date.UTC(2099, 2, 1));
const bis = new Date(Date.UTC(2099, 2, 8));
const bezahltAm = new Date(Date.UTC(2099, 2, 3, 10, 0));

let bookingId: string;
let customerId: string;

beforeAll(async () => {
  const product = await prisma.product.findUniqueOrThrow({ where: { code: ProductCode.VALET } });
  const customer = await prisma.customer.create({
    data: { email: `revtest-${Date.now()}@example.com`, name: "Umsatz Test" },
  });
  customerId = customer.id;

  const booking = await prisma.booking.create({
    data: {
      bookingNumber: `REV-${Date.now()}`,
      customerId: customer.id,
      productId: product.id,
      status: "BEZAHLT",
      anreise: new Date(Date.UTC(2099, 2, 3, 12, 0)),
      abreise: new Date(Date.UTC(2099, 2, 5, 10, 0)), // 2 Tage
      preisTageCent: 10000,
      preisAddonsCent: 3900,
      gutscheinRabattCent: 0,
      preisGesamtCent: 13900,
      preisBreakdown: {},
      addons: { create: [{ serviceAddonId: (await ersterAddonId()), preisCentSnapshot: 3900, nameSnapshot: "Test-Aufbereitung" }] },
      payment: { create: { betragCent: 13900, status: "BEZAHLT", bezahltAm } },
    },
  });
  bookingId = booking.id;
});

async function ersterAddonId(): Promise<string> {
  const a = await prisma.serviceAddon.findFirst();
  if (!a) throw new Error("Kein ServiceAddon vorhanden (Seed ausführen).");
  return a.id;
}

afterAll(async () => {
  await prisma.booking.deleteMany({ where: { id: bookingId } });
  await prisma.customer.deleteMany({ where: { id: customerId } });
  await prisma.$disconnect();
});

describe("berechneUmsatz", () => {
  it("summiert Brutto und Quellen korrekt", async () => {
    const r = await berechneUmsatz(von, bis, "tag");
    expect(r.bruttoCent).toBe(13900);

    const valet = r.quellen.find((q) => q.quelle === "Valet – Parken");
    const addon = r.quellen.find((q) => q.quelle === "Test-Aufbereitung");
    expect(valet?.betragCent).toBe(10000);
    expect(addon?.betragCent).toBe(3900);

    // Summe der Quellen == Brutto
    const summe = r.quellen.reduce((s, q) => s + q.betragCent, 0);
    expect(summe).toBe(13900);
  });

  it("weist USt (19%) und Netto korrekt aus", async () => {
    const r = await berechneUmsatz(von, bis, "tag");
    expect(r.ustAusweis.nettoCent + r.ustAusweis.ustCent).toBe(r.bruttoCent);
    expect(r.nettoNachStornoCent).toBe(13900); // keine Erstattung
  });

  it("berechnet Ø Buchungsdauer und Ø Erlös je Fahrzeug-Tag", async () => {
    const r = await berechneUmsatz(von, bis, "tag");
    expect(r.kennzahlen.oBuchungsdauerTage).toBe(2);
    expect(r.kennzahlen.oErloesProFahrzeugTagCent).toBe(6950); // 13900 / 2 Tage
  });
});
