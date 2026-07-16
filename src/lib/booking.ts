import { prisma } from "@/lib/prisma";
import { belegteTage, berlinZeitpunkt } from "@/lib/date";
import { berechnePreis, type AddonInput } from "@/lib/pricing";
import { verfuegbareTage } from "@/lib/capacity";
import type { QuoteInput } from "@/lib/booking-schema";
import { ProductCode } from "@/generated/prisma/client";

export class ProduktNichtGefundenError extends Error {}
export class GutscheinUngueltigError extends Error {}

export async function ladeProdukt(productCode: "VALET" | "SHUTTLE") {
  const product = await prisma.product.findUnique({
    where: { code: productCode as ProductCode, active: true },
  });
  if (!product) throw new ProduktNichtGefundenError(`Produkt ${productCode} nicht gefunden.`);
  return product;
}

export interface VoucherPruefung {
  gueltig: boolean;
  grund?: string;
  voucherId?: string;
}

export async function pruefeGutschein(
  code: string | undefined,
  email: string | undefined
): Promise<VoucherPruefung> {
  if (!code) return { gueltig: false };
  if (!email) return { gueltig: false, grund: "Bitte zuerst E-Mail-Adresse angeben." };

  const voucher = await prisma.voucher.findUnique({
    where: { code },
    include: { customer: true },
  });
  if (!voucher) return { gueltig: false, grund: "Gutscheincode nicht gefunden." };
  if (voucher.redeemedAt) return { gueltig: false, grund: "Gutschein wurde bereits eingelöst." };
  if (voucher.customer.email.toLowerCase() !== email.trim().toLowerCase()) {
    return { gueltig: false, grund: "Gutschein ist an eine andere E-Mail-Adresse gebunden." };
  }
  return { gueltig: true, voucherId: voucher.id };
}

export async function berechneAngebot(input: QuoteInput) {
  const product = await ladeProdukt(input.productCode);
  const anreise = berlinZeitpunkt(input.anreiseDatum, input.anreiseZeit);
  const abreise = berlinZeitpunkt(input.abreiseDatum, input.abreiseZeit);

  if (abreise.getTime() <= anreise.getTime()) {
    throw new RangeError("Die Abreise muss nach der Anreise liegen.");
  }

  const tage = belegteTage(anreise, abreise);

  const [tariffRules, seasonRates, blockedDaysGlobal, blockedDaysProdukt, addonRows, verfuegbarkeit, voucher] =
    await Promise.all([
      prisma.tariffRule.findMany({ where: { productId: product.id } }),
      prisma.seasonRate.findMany({ where: { productId: product.id } }),
      prisma.blockedDay.findMany({ where: { productId: null, date: { in: tage } } }),
      prisma.blockedDay.findMany({ where: { productId: product.id, date: { in: tage } } }),
      input.addonCodes.length
        ? prisma.serviceAddon.findMany({ where: { code: { in: input.addonCodes }, active: true } })
        : Promise.resolve([]),
      verfuegbareTage(product.id, tage),
      pruefeGutschein(input.voucherCode, input.customerEmail),
    ]);

  const addons: AddonInput[] = addonRows.map((a) => ({ code: a.code, name: a.name, preisCent: a.preisCent }));

  const preis = berechnePreis({
    anreise,
    abreise,
    tariffRules,
    seasonRates,
    blockedDays: [...blockedDaysGlobal, ...blockedDaysProdukt],
    addons,
    gutscheinAnwenden: voucher.gueltig,
  });

  return {
    product,
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
