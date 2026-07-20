import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, ProductCode } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TAGE_IM_VORAUS = 365;

async function main() {
  // Auf Vercel läuft der Seed bei JEDEM Deploy. Mit SEED_ONLY_IF_EMPTY=1 wird nur
  // eine wirklich leere Datenbank einmalig befüllt – so überschreiben spätere Deploys
  // keine im Admin gepflegten Preise/Kapazitäten oder echte Buchungsdaten.
  if (process.env.SEED_ONLY_IF_EMPTY === "1") {
    const vorhanden = await prisma.product.count();
    if (vorhanden > 0) {
      console.log("Datenbank bereits initialisiert – Seed übersprungen.");
      return;
    }
  }

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

  // Beispiel-Saisonzeitraum als prozentualer Zuschlag je Produkt (gilt für alle Klassen).
  await prisma.seasonRate.deleteMany({});
  await prisma.seasonRate.createMany({
    data: [
      {
        productId: valet.id,
        vehicleClassId: null,
        name: "Weihnachten 2026",
        startDate: new Date("2026-12-15"),
        endDate: new Date("2027-01-15"),
        zuschlagProzent: 20,
      },
      {
        productId: shuttle.id,
        vehicleClassId: null,
        name: "Weihnachten 2026",
        startDate: new Date("2026-12-15"),
        endDate: new Date("2027-01-15"),
        zuschlagProzent: 15,
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
      steuerRuecklageProzent: 25,
    },
  });

  // Ausgaben-Kategorien (im Admin pflegbar).
  const kategorien = [
    "Miete",
    "Personal",
    "Sprit / Tanken",
    "Versicherung",
    "Marketing",
    "Partner-Aufbereitung",
    "Sonstiges",
  ];
  for (let i = 0; i < kategorien.length; i++) {
    await prisma.expenseCategory.upsert({
      where: { name: kategorien[i] },
      update: {},
      create: { name: kategorien[i], sortOrder: i + 1 },
    });
  }

  // FlySpot Service – Rundum-Serviceangebot fürs Fahrzeug (Startkatalog, im Admin
  // pflegbar). FESTPREIS-Leistungen haben je Fahrzeugklasse einen Preis und sind
  // grundsätzlich online buchbar; ANFRAGE-Leistungen werden individuell per
  // Angebot abgewickelt (Kunde stellt Anfrage, Team meldet sich).
  const services: {
    code: string;
    name: string;
    kategorie: string;
    beschreibung: string | null;
    typ: "FESTPREIS" | "ANFRAGE";
    sortOrder: number;
    preise?: { kleinwagen: number; mittelklasse: number; suvVan: number };
  }[] = [
    {
      code: "aussenwaesche",
      name: "Außenwäsche",
      kategorie: "Reinigung",
      beschreibung: "Handwäsche außen inkl. Felgen und Trocknen.",
      typ: "FESTPREIS",
      sortOrder: 1,
      preise: { kleinwagen: 2900, mittelklasse: 3400, suvVan: 3900 },
    },
    {
      code: "innenreinigung",
      name: "Innenreinigung",
      kategorie: "Reinigung",
      beschreibung: "Saugen, Staub, Scheiben innen, Kunststoffpflege.",
      typ: "FESTPREIS",
      sortOrder: 2,
      preise: { kleinwagen: 3900, mittelklasse: 4500, suvVan: 5200 },
    },
    {
      code: "innen-aussen",
      name: "Innen- & Außenreinigung",
      kategorie: "Reinigung",
      beschreibung: "Komplettreinigung innen und außen aus einer Hand.",
      typ: "FESTPREIS",
      sortOrder: 3,
      preise: { kleinwagen: 5900, mittelklasse: 6900, suvVan: 7900 },
    },
    {
      code: "politur",
      name: "Politur",
      kategorie: "Aufbereitung",
      beschreibung: "Lackpolitur für frischen Glanz und Schutz.",
      typ: "FESTPREIS",
      sortOrder: 4,
      preise: { kleinwagen: 12900, mittelklasse: 14900, suvVan: 17900 },
    },
    {
      code: "detailing",
      name: "Detailing (Komplettaufbereitung)",
      kategorie: "Aufbereitung",
      beschreibung: "Umfassende Innen- und Außenaufbereitung nach Zustand – Preis auf Anfrage.",
      typ: "ANFRAGE",
      sortOrder: 5,
    },
    {
      code: "smart-repair-kratzer",
      name: "Kratzer & Lackschäden (Smart Repair)",
      kategorie: "Reparatur",
      beschreibung: "Ausbesserung kleiner Kratzer und Lackschäden – Preis nach Begutachtung.",
      typ: "ANFRAGE",
      sortOrder: 6,
    },
    {
      code: "smart-repair-dellen",
      name: "Dellen & Beulen (Smart Repair)",
      kategorie: "Reparatur",
      beschreibung: "Schonende Dellenentfernung ohne Lackieren, wo möglich – Preis nach Begutachtung.",
      typ: "ANFRAGE",
      sortOrder: 7,
    },
    {
      code: "glasreparatur",
      name: "Steinschlag & Glasreparatur",
      kategorie: "Reparatur",
      beschreibung: "Reparatur kleiner Steinschläge in der Frontscheibe – Preis nach Begutachtung.",
      typ: "ANFRAGE",
      sortOrder: 8,
    },
  ];

  for (const s of services) {
    const saved = await prisma.service.upsert({
      where: { code: s.code },
      update: {
        name: s.name,
        kategorie: s.kategorie,
        beschreibung: s.beschreibung,
        typ: s.typ,
        sortOrder: s.sortOrder,
      },
      create: {
        code: s.code,
        name: s.name,
        kategorie: s.kategorie,
        beschreibung: s.beschreibung,
        typ: s.typ,
        sortOrder: s.sortOrder,
      },
    });
    if (s.preise) {
      for (const [klasse, preisCent] of [
        [kleinwagen, s.preise.kleinwagen],
        [mittelklasse, s.preise.mittelklasse],
        [suvVan, s.preise.suvVan],
      ] as const) {
        await prisma.servicePreis.upsert({
          where: { serviceId_vehicleClassId: { serviceId: saved.id, vehicleClassId: klasse.id } },
          update: { preisCent },
          create: { serviceId: saved.id, vehicleClassId: klasse.id, preisCent },
        });
      }
    }
  }

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
