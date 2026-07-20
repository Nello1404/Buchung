import { prisma } from "@/lib/prisma";
import { belegteTage, berlinZeitpunkt } from "@/lib/date";
import { berechnePreis, type AddonInput } from "@/lib/pricing";
import { verfuegbareTage } from "@/lib/capacity";
import type { QuoteInput } from "@/lib/booking-schema";
import { ProductCode } from "@/generated/prisma/client";

export class ProduktNichtGefundenError extends Error {}
export class FahrzeugklasseNichtGefundenError extends Error {}
export class GutscheinUngueltigError extends Error {}

export async function ladeProdukt(productCode: "VALET" | "SHUTTLE") {
  const product = await prisma.product.findUnique({
    where: { code: productCode as ProductCode, active: true },
  });
  if (!product) throw new ProduktNichtGefundenError(`Produkt ${productCode} nicht gefunden.`);
  return product;
}

export async function ladeFahrzeugklasse(vehicleClassCode: string) {
  const vehicleClass = await prisma.vehicleClass.findFirst({
    where: { code: vehicleClassCode, active: true },
  });
  if (!vehicleClass) {
    throw new FahrzeugklasseNichtGefundenError(`Fahrzeugklasse ${vehicleClassCode} nicht gefunden.`);
  }
  return vehicleClass;
}

export interface VoucherPruefung {
  gueltig: boolean;
  grund?: string;
  voucherId?: string;
  typ?: "TAG_GRATIS" | "PROZENT" | "BETRAG";
  wert?: number;
}

export async function pruefeGutschein(
  code: string | undefined,
  email: string | undefined
): Promise<VoucherPruefung> {
  if (!code) return { gueltig: false };

  const voucher = await prisma.voucher.findUnique({
    where: { code },
    include: { customer: true },
  });
  if (!voucher) return { gueltig: false, grund: "Gutscheincode nicht gefunden." };
  if (voucher.redeemedAt) return { gueltig: false, grund: "Gutschein wurde bereits eingelöst." };

  // An einen Kunden gebundene Gutscheine (Treueaktion) erfordern die passende E-Mail.
  if (voucher.customerId) {
    if (!email) return { gueltig: false, grund: "Bitte zuerst E-Mail-Adresse angeben." };
    if (voucher.customer?.email.toLowerCase() !== email.trim().toLowerCase()) {
      return { gueltig: false, grund: "Gutschein ist an eine andere E-Mail-Adresse gebunden." };
    }
  }

  return { gueltig: true, voucherId: voucher.id, typ: voucher.typ, wert: voucher.wert };
}

export async function berechneAngebot(input: QuoteInput) {
  const product = await ladeProdukt(input.productCode);
  const vehicleClass = await ladeFahrzeugklasse(input.vehicleClassCode);
  const anreise = berlinZeitpunkt(input.anreiseDatum, input.anreiseZeit);
  const abreise = berlinZeitpunkt(input.abreiseDatum, input.abreiseZeit);

  if (abreise.getTime() <= anreise.getTime()) {
    throw new RangeError("Die Abreise muss nach der Anreise liegen.");
  }

  const tage = belegteTage(anreise, abreise);

  const serviceCodes = input.serviceCodes ?? [];

  const [
    tariffRules,
    seasonRates,
    blockedDaysGlobal,
    blockedDaysProdukt,
    addonPreise,
    servicePreise,
    verfuegbarkeit,
    voucher,
  ] = await Promise.all([
    prisma.tariffRule.findMany({ where: { productId: product.id, vehicleClassId: vehicleClass.id } }),
    // Saison-Regeln: produktweite Zuschläge (vehicleClassId = null) ODER klassenspezifische.
    prisma.seasonRate.findMany({
      where: { productId: product.id, OR: [{ vehicleClassId: null }, { vehicleClassId: vehicleClass.id }] },
    }),
    prisma.blockedDay.findMany({ where: { productId: null, date: { in: tage } } }),
    prisma.blockedDay.findMany({ where: { productId: product.id, date: { in: tage } } }),
    input.addonCodes.length
      ? prisma.serviceAddonPrice.findMany({
          where: {
            vehicleClassId: vehicleClass.id,
            serviceAddon: { code: { in: input.addonCodes }, active: true },
          },
          include: { serviceAddon: true },
        })
      : Promise.resolve([]),
    // Festpreis-Leistungen aus dem FlySpot-Service-Katalog (nur mit Preis für diese Klasse).
    serviceCodes.length
      ? prisma.servicePreis.findMany({
          where: {
            vehicleClassId: vehicleClass.id,
            service: { code: { in: serviceCodes }, active: true, typ: "FESTPREIS" },
          },
          include: { service: true },
        })
      : Promise.resolve([]),
    verfuegbareTage(product.id, tage),
    pruefeGutschein(input.voucherCode, input.customerEmail),
  ]);

  // Buchungs-Zusatzservices und Katalog-Festpreise fließen als gemeinsame
  // "Zusatzleistungen" in Preis, Übersicht und Stripe-Positionen ein.
  const addonRows = [
    ...addonPreise.map((a) => ({
      serviceAddonId: a.serviceAddonId as string | null,
      serviceId: null as string | null,
      code: a.serviceAddon.code,
      name: a.serviceAddon.name,
      preisCent: a.preisCent,
    })),
    ...servicePreise.map((s) => ({
      serviceAddonId: null as string | null,
      serviceId: s.serviceId as string | null,
      code: s.service.code,
      name: s.service.name,
      preisCent: s.preisCent,
    })),
  ];

  const addons: AddonInput[] = addonRows.map((a) => ({
    code: a.code,
    name: a.name,
    preisCent: a.preisCent,
  }));

  const preis = berechnePreis({
    anreise,
    abreise,
    tariffRules,
    seasonRates,
    blockedDays: [...blockedDaysGlobal, ...blockedDaysProdukt],
    addons,
    gutschein: voucher.gueltig && voucher.typ ? { typ: voucher.typ, wert: voucher.wert ?? 0 } : null,
  });

  return {
    product,
    vehicleClass,
    anreise,
    abreise,
    tage,
    preis,
    verfuegbar: verfuegbarkeit.verfuegbar,
    ausgebuchteTage: verfuegbarkeit.ausgebuchteTage,
    voucher,
    addonRows,
  };
}

export function generiereBuchungsnummer(): string {
  const jahr = new Date().getFullYear();
  const zufall = Math.floor(100000 + Math.random() * 900000);
  return `FS-${jahr}-${zufall}`;
}
