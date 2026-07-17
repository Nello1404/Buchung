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

  // Fahrzeugklassen (frei im Admin erweiterbar). Jede Klasse hat eine eigene,
  // unabhängige Preistabelle für Parkgebühr und Zusatzservices.
  const kleinwagen = await prisma.vehicleClass.upsert({
    where: { code: "KLEINWAGEN" },
    update: {},
    create: { code: "KLEINWAGEN", name: "Kleinwagen", sortOrder: 1 },
  });
  const mittelklasse = await prisma.vehicleClass.upsert({
    where: { code: "MITTELKLASSE" },
    update: {},
    create: { code: "MITTELKLASSE", name: "Mittelklasse", sortOrder: 2 },
  });
  const suvVan = await prisma.vehicleClass.upsert({
    where: { code: "SUV_VAN" },
    update: {},
    create: { code: "SUV_VAN", name: "SUV & Van", sortOrder: 3 },
  });

  // Beispiel-Tarife (Platzhalter – im Admin änderbar). Preise in Cent.
  // Je Fahrzeugklasse eine eigenständige Preistabelle (kein automatischer Aufschlag).
  await prisma.tariffRule.deleteMany({});
  await prisma.tariffRule.createMany({
    data: [
      // Valet – Kleinwagen
      { productId: valet.id, vehicleClassId: kleinwagen.id, minTage: 1, maxTage: 3, preisProTagCent: 4500 },
      { productId: valet.id, vehicleClassId: kleinwagen.id, minTage: 4, maxTage: 7, preisProTagCent: 3900 },
      { productId: valet.id, vehicleClassId: kleinwagen.id, minTage: 8, maxTage: 14, preisProTagCent: 3300 },
      { productId: valet.id, vehicleClassId: kleinwagen.id, minTage: 15, maxTage: null, preisProTagCent: 2700 },
      // Valet – Mittelklasse
      { productId: valet.id, vehicleClassId: mittelklasse.id, minTage: 1, maxTage: 3, preisProTagCent: 5200 },
      { productId: valet.id, vehicleClassId: mittelklasse.id, minTage: 4, maxTage: 7, preisProTagCent: 4500 },
      { productId: valet.id, vehicleClassId: mittelklasse.id, minTage: 8, maxTage: 14, preisProTagCent: 3800 },
      { productId: valet.id, vehicleClassId: mittelklasse.id, minTage: 15, maxTage: null, preisProTagCent: 3100 },
      // Valet – SUV & Van
      { productId: valet.id, vehicleClassId: suvVan.id, minTage: 1, maxTage: 3, preisProTagCent: 5900 },
      { productId: valet.id, vehicleClassId: suvVan.id, minTage: 4, maxTage: 7, preisProTagCent: 5100 },
      { productId: valet.id, vehicleClassId: suvVan.id, minTage: 8, maxTage: 14, preisProTagCent: 4300 },
      { productId: valet.id, vehicleClassId: suvVan.id, minTage: 15, maxTage: null, preisProTagCent: 3500 },

      // Shuttle – Kleinwagen
      { productId: shuttle.id, vehicleClassId: kleinwagen.id, minTage: 1, maxTage: 3, preisProTagCent: 2100 },
      { productId: shuttle.id, vehicleClassId: kleinwagen.id, minTage: 4, maxTage: 7, preisProTagCent: 1800 },
      { productId: shuttle.id, vehicleClassId: kleinwagen.id, minTage: 8, maxTage: 14, preisProTagCent: 1500 },
      { productId: shuttle.id, vehicleClassId: kleinwagen.id, minTage: 15, maxTage: null, preisProTagCent: 1200 },
      // Shuttle – Mittelklasse
      { productId: shuttle.id, vehicleClassId: mittelklasse.id, minTage: 1, maxTage: 3, preisProTagCent: 2400 },
      { productId: shuttle.id, vehicleClassId: mittelklasse.id, minTage: 4, maxTage: 7, preisProTagCent: 2100 },
      { productId: shuttle.id, vehicleClassId: mittelklasse.id, minTage: 8, maxTage: 14, preisProTagCent: 1700 },
      { productId: shuttle.id, vehicleClassId: mittelklasse.id, minTage: 15, maxTage: null, preisProTagCent: 1400 },
      // Shuttle – SUV & Van
      { productId: shuttle.id, vehicleClassId: suvVan.id, minTage: 1, maxTage: 3, preisProTagCent: 2700 },
      { productId: shuttle.id, vehicleClassId: suvVan.id, minTage: 4, maxTage: 7, preisProTagCent: 2300 },
      { productId: shuttle.id, vehicleClassId: suvVan.id, minTage: 8, maxTage: 14, preisProTagCent: 2000 },
      { productId: shuttle.id, vehicleClassId: suvVan.id, minTage: 15, maxTage: null, preisProTagCent: 1600 },
    ],
  });

  // Beispiel-Saisonzeitraum (Sommerferien Hessen 2026) mit eigenem Tagespreis je Klasse.
  await prisma.seasonRate.deleteMany({});
  await prisma.seasonRate.createMany({
    data: [
      {
        productId: valet.id,
        vehicleClassId: kleinwagen.id,
        name: "Sommerferien Hessen 2026",
        startDate: new Date("2026-06-27"),
        endDate: new Date("2026-08-04"),
        preisProTagCent: 5500,
      },
      {
        productId: valet.id,
        vehicleClassId: mittelklasse.id,
        name: "Sommerferien Hessen 2026",
        startDate: new Date("2026-06-27"),
        endDate: new Date("2026-08-04"),
        preisProTagCent: 6300,
      },
      {
        productId: valet.id,
        vehicleClassId: suvVan.id,
        name: "Sommerferien Hessen 2026",
        startDate: new Date("2026-06-27"),
        endDate: new Date("2026-08-04"),
        preisProTagCent: 7100,
      },
      {
        productId: shuttle.id,
        vehicleClassId: kleinwagen.id,
        name: "Sommerferien Hessen 2026",
        startDate: new Date("2026-06-27"),
        endDate: new Date("2026-08-04"),
        preisProTagCent: 2700,
      },
      {
        productId: shuttle.id,
        vehicleClassId: mittelklasse.id,
        name: "Sommerferien Hessen 2026",
        startDate: new Date("2026-06-27"),
        endDate: new Date("2026-08-04"),
        preisProTagCent: 3100,
      },
      {
        productId: shuttle.id,
        vehicleClassId: suvVan.id,
        name: "Sommerferien Hessen 2026",
        startDate: new Date("2026-06-27"),
        endDate: new Date("2026-08-04"),
        preisProTagCent: 3500,
      },
    ],
  });

  // Zusatzservices: Katalogeintrag (Name/Beschreibung) + Preis je Fahrzeugklasse.
  // Aufbereitung skaliert mit der Fahrzeuggröße (mehr Fläche/Aufwand), Tank-/
  // Ladeservice ist eine reine Servicegebühr unabhängig von der Fahrzeuggröße.
  const addons = [
    {
      code: "kleine-aufbereitung",
      name: "Kleine Aufbereitung (Wäsche + Innenraum)",
      description: null as string | null,
      preise: { kleinwagen: 3900, mittelklasse: 4500, suvVan: 5200 },
    },
    {
      code: "grosse-aufbereitung",
      name: "Große Aufbereitung (inkl. Politur)",
      description: null,
      preise: { kleinwagen: 8900, mittelklasse: 9900, suvVan: 11900 },
    },
    {
      code: "tankservice",
      name: "Tankservice (Verbrenner)",
      description: "Servicegebühr – der Kraftstoff wird separat vor Ort abgerechnet.",
      preise: { kleinwagen: 900, mittelklasse: 900, suvVan: 900 },
    },
    {
      code: "ladeservice",
      name: "E-Ladeservice",
      description: "Servicegebühr – der Ladestrom wird separat vor Ort abgerechnet.",
      preise: { kleinwagen: 1200, mittelklasse: 1200, suvVan: 1200 },
    },
  ];

  for (const addon of addons) {
    const saved = await prisma.serviceAddon.upsert({
      where: { code: addon.code },
      update: { name: addon.name, description: addon.description },
      create: { code: addon.code, name: addon.name, description: addon.description },
    });
    for (const [klasse, preisCent] of [
      [kleinwagen, addon.preise.kleinwagen],
      [mittelklasse, addon.preise.mittelklasse],
      [suvVan, addon.preise.suvVan],
    ] as const) {
      await prisma.serviceAddonPrice.upsert({
        where: { serviceAddonId_vehicleClassId: { serviceAddonId: saved.id, vehicleClassId: klasse.id } },
        update: { preisCent },
        create: { serviceAddonId: saved.id, vehicleClassId: klasse.id, preisCent },
      });
    }
  }

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
