import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ProductCode } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TAGE_IM_VORAUS = 365;

async function main() {
  const valet = await prisma.product.upsert({
    where: { code: ProductCode.VALET },
    update: {},
    create: { code: ProductCode.VALET, name: "Valet (Hol & Bring)" },
  });

  const shuttle = await prisma.product.upsert({
    where: { code: ProductCode.SHUTTLE },
    update: {},
    create: { code: ProductCode.SHUTTLE, name: "Shuttle (Selbstanfahrt)" },
  });

  // Beispiel-Tarife (Platzhalter – im Admin änderbar). Preise in Cent.
  await prisma.tariffRule.deleteMany({});
  await prisma.tariffRule.createMany({
    data: [
      { productId: valet.id, minTage: 1, maxTage: 3, preisProTagCent: 4500 },
      { productId: valet.id, minTage: 4, maxTage: 7, preisProTagCent: 3900 },
      { productId: valet.id, minTage: 8, maxTage: 14, preisProTagCent: 3300 },
      { productId: valet.id, minTage: 15, maxTage: null, preisProTagCent: 2700 },

      { productId: shuttle.id, minTage: 1, maxTage: 3, preisProTagCent: 2100 },
      { productId: shuttle.id, minTage: 4, maxTage: 7, preisProTagCent: 1800 },
      { productId: shuttle.id, minTage: 8, maxTage: 14, preisProTagCent: 1500 },
      { productId: shuttle.id, minTage: 15, maxTage: null, preisProTagCent: 1200 },
    ],
  });

  // Beispiel-Saisonzeitraum (Sommerferien Hessen 2026) mit eigenem Tagespreis.
  await prisma.seasonRate.deleteMany({});
  await prisma.seasonRate.createMany({
    data: [
      {
        productId: valet.id,
        name: "Sommerferien Hessen 2026",
        startDate: new Date("2026-06-27"),
        endDate: new Date("2026-08-04"),
        preisProTagCent: 5500,
      },
      {
        productId: shuttle.id,
        name: "Sommerferien Hessen 2026",
        startDate: new Date("2026-06-27"),
        endDate: new Date("2026-08-04"),
        preisProTagCent: 2700,
      },
    ],
  });

  await prisma.serviceAddon.upsert({
    where: { code: "kleine-aufbereitung" },
    update: {},
    create: {
      code: "kleine-aufbereitung",
      name: "Kleine Aufbereitung (Wäsche + Innenraum)",
      preisCent: 3900,
    },
  });
  await prisma.serviceAddon.upsert({
    where: { code: "grosse-aufbereitung" },
    update: {},
    create: {
      code: "grosse-aufbereitung",
      name: "Große Aufbereitung (inkl. Politur)",
      preisCent: 8900,
    },
  });
  await prisma.serviceAddon.upsert({
    where: { code: "tankservice" },
    update: {},
    create: {
      code: "tankservice",
      name: "Tankservice (Verbrenner)",
      description: "Servicegebühr – der Kraftstoff wird separat vor Ort abgerechnet.",
      preisCent: 900,
    },
  });
  await prisma.serviceAddon.upsert({
    where: { code: "ladeservice" },
    update: {},
    create: {
      code: "ladeservice",
      name: "E-Ladeservice",
      description: "Servicegebühr – der Ladestrom wird separat vor Ort abgerechnet.",
      preisCent: 1200,
    },
  });

  // Kapazität für die nächsten 365 Tage anlegen (Standardkontingente).
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const [product, kontingent] of [
    [valet, 99],
    [shuttle, 43],
  ] as const) {
    const data = [];
    for (let i = 0; i < TAGE_IM_VORAUS; i++) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() + i);
      data.push({ productId: product.id, date, kontingent });
    }
    await prisma.capacityDay.createMany({
      data,
      skipDuplicates: true,
    });
  }

  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      stornoFristStunden: 48,
      stornoErstattungFrueh: 100,
      stornoErstattungSpaet: 50,
    },
  });

  // Demo-Kunde + Gutschein zum lokalen Testen der Gutschein-Einlösung.
  const demoCustomer = await prisma.customer.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: { email: "test@example.com", name: "Test Kunde" },
  });
  await prisma.voucher.upsert({
    where: { code: "WILLKOMMEN1" },
    update: {},
    create: { code: "WILLKOMMEN1", customerId: demoCustomer.id },
  });

  console.log("Seed abgeschlossen.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
