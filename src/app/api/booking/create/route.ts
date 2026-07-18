import { NextResponse } from "next/server";
import { createBookingSchema } from "@/lib/booking-schema";
import {
  berechneAngebot,
  FahrzeugklasseNichtGefundenError,
  generiereBuchungsnummer,
  ProduktNichtGefundenError,
} from "@/lib/booking";
import { KapazitaetError, reserviereKapazitaet, gibKapazitaetFrei } from "@/lib/capacity";
import { KeinTarifError, SperrtagError } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

// Basis-URL für Stripe Success-/Cancel-Weiterleitung: bevorzugt die ausdrücklich
// gesetzte NEXT_PUBLIC_BASE_URL, sonst automatisch die Vercel-Produktions-URL,
// sonst lokal. So funktioniert das Live-Deployment ohne manuelle URL-Konfiguration.
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
const CHECKOUT_GUELTIGKEIT_MINUTEN = 30;

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  let angebot;
  try {
    angebot = await berechneAngebot(input);
  } catch (error) {
    if (error instanceof SperrtagError) {
      return NextResponse.json({ error: error.message, code: "SPERRTAG" }, { status: 409 });
    }
    if (error instanceof KeinTarifError) {
      return NextResponse.json({ error: error.message, code: "KEIN_TARIF" }, { status: 422 });
    }
    if (
      error instanceof ProduktNichtGefundenError ||
      error instanceof FahrzeugklasseNichtGefundenError ||
      error instanceof RangeError
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Buchung konnte nicht berechnet werden." }, { status: 500 });
  }

  if (!angebot.verfuegbar) {
    return NextResponse.json(
      {
        error: "Für den gewählten Zeitraum ist kein Kontingent mehr frei.",
        code: "AUSGEBUCHT",
        ausgebuchteTage: angebot.ausgebuchteTage.map((d) => d.toISOString().slice(0, 10)),
      },
      { status: 409 }
    );
  }

  if (input.voucherCode && !angebot.voucher.gueltig) {
    return NextResponse.json(
      { error: angebot.voucher.grund ?? "Gutscheincode ungültig.", code: "GUTSCHEIN_UNGUELTIG" },
      { status: 422 }
    );
  }

  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  const stornoFristStunden = settings?.stornoFristStunden ?? 48;
  const stornoErstattungFruehProzent = settings?.stornoErstattungFrueh ?? 100;
  const stornoErstattungSpaetProzent = settings?.stornoErstattungSpaet ?? 50;

  let bookingId: string;
  let bookingNumber: string;
  try {
    const result = await prisma.$transaction(async (tx) => {
      await reserviereKapazitaet(tx, angebot.product.id, angebot.tage);

      const customer = await tx.customer.upsert({
        where: { email: input.kunde.email.toLowerCase() },
        update: { name: input.kunde.name, phone: input.kunde.telefon },
        create: {
          email: input.kunde.email.toLowerCase(),
          name: input.kunde.name,
          phone: input.kunde.telefon,
        },
      });

      let nummer = generiereBuchungsnummer();
      let versuche = 0;
      // Kollisionswahrscheinlichkeit ist verschwindend gering, Retry nur als Sicherheitsnetz.
      while (versuche < 5) {
        const existiert = await tx.booking.findUnique({ where: { bookingNumber: nummer } });
        if (!existiert) break;
        nummer = generiereBuchungsnummer();
        versuche++;
      }
      bookingNumber = nummer;

      const booking = await tx.booking.create({
        data: {
          bookingNumber: nummer,
          customerId: customer.id,
          productId: angebot.product.id,
          anreise: angebot.anreise,
          abreise: angebot.abreise,
          flugnummer: input.flugnummer,
          rueckflugnummer: input.rueckflugnummer,
          preisTageCent: angebot.preis.preisTageCent,
          preisAddonsCent: angebot.preis.preisAddonsCent,
          gutscheinRabattCent: angebot.preis.gutscheinRabattCent,
          preisGesamtCent: angebot.preis.preisGesamtCent,
          preisBreakdown: JSON.parse(JSON.stringify(angebot.preis)),
          stornoFristStunden,
          stornoErstattungFruehProzent,
          stornoErstattungSpaetProzent,
          vehicle: {
            create: {
              kennzeichen: input.fahrzeug.kennzeichen,
              marke: input.fahrzeug.marke,
              farbe: input.fahrzeug.farbe,
              auffaelligkeiten: input.fahrzeug.auffaelligkeiten,
              vehicleClassId: angebot.vehicleClass.id,
              vehicleClassNameSnapshot: angebot.vehicleClass.name,
            },
          },
          addons: angebot.addonRows.length
            ? {
                create: angebot.addonRows.map((a) => ({
                  serviceAddonId: a.id,
                  preisCentSnapshot: a.preisCent,
                  nameSnapshot: a.name,
                })),
              }
            : undefined,
        },
      });

      if (angebot.voucher.gueltig && angebot.voucher.voucherId) {
        await tx.voucher.update({
          where: { id: angebot.voucher.voucherId },
          data: { redeemedBookingId: booking.id },
        });
      }

      await tx.payment.create({
        data: { bookingId: booking.id, betragCent: angebot.preis.preisGesamtCent },
      });

      return booking;
    });

    bookingId = result.id;
  } catch (error) {
    if (error instanceof KapazitaetError) {
      return NextResponse.json(
        { error: "Für den gewählten Zeitraum ist kein Kontingent mehr frei.", code: "AUSGEBUCHT" },
        { status: 409 }
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Buchung konnte nicht angelegt werden." }, { status: 500 });
  }

  try {
    const stripe = getStripe();
    const lineItems = [
      {
        price_data: {
          currency: "eur",
          product_data: { name: `${angebot.product.name} – ${angebot.tage.length} Tag(e) Parken` },
          unit_amount: angebot.preis.preisTageCent,
        },
        quantity: 1,
      },
      ...angebot.preis.addonBreakdown.map((a) => ({
        price_data: {
          currency: "eur",
          product_data: { name: a.name },
          unit_amount: a.preisCent,
        },
        quantity: 1,
      })),
    ];

    const discounts = [];
    if (angebot.preis.gutscheinRabattCent > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: angebot.preis.gutscheinRabattCent,
        currency: "eur",
        duration: "once",
        name: "Treue-Gutschein (1 Tag gratis)",
      });
      discounts.push({ coupon: coupon.id });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.kunde.email,
      line_items: lineItems,
      discounts: discounts.length ? discounts : undefined,
      success_url: `${BASE_URL}/bestaetigung/${bookingId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/buchen?abgebrochen=1`,
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_GUELTIGKEIT_MINUTEN * 60,
      metadata: { bookingId, bookingNumber: bookingNumber! },
    });

    await prisma.payment.update({
      where: { bookingId },
      data: { stripeCheckoutSessionId: session.id },
    });

    return NextResponse.json({ bookingId, bookingNumber: bookingNumber!, checkoutUrl: session.url });
  } catch (error) {
    console.error("Stripe-Checkout fehlgeschlagen, Buchung wird zurückgerollt:", error);
    await prisma.$transaction(async (tx) => {
      await gibKapazitaetFrei(tx, angebot.product.id, angebot.tage);
      await tx.booking.update({ where: { id: bookingId }, data: { status: "STORNIERT", storniertAm: new Date() } });
    });
    return NextResponse.json({ error: "Zahlungsvorgang konnte nicht gestartet werden." }, { status: 502 });
  }
}
