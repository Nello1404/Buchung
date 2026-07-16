import { NextResponse } from "next/server";
import { cancelBookingSchema } from "@/lib/cancel-schema";
import { prisma } from "@/lib/prisma";
import { belegteTage } from "@/lib/date";
import { gibKapazitaetFrei } from "@/lib/capacity";
import { getStripe } from "@/lib/stripe";
import { sendeStornoBestaetigung } from "@/lib/email";
import { berechneErstattung } from "@/lib/storno";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = cancelBookingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { bookingNumber: parsed.data.bookingNumber },
    include: { customer: true, payment: true },
  });

  if (!booking || booking.customer.email.toLowerCase() !== parsed.data.email.trim().toLowerCase()) {
    return NextResponse.json(
      { error: "Keine Buchung mit dieser Buchungsnummer und E-Mail-Adresse gefunden." },
      { status: 404 }
    );
  }

  if (booking.status === "STORNIERT") {
    return NextResponse.json({ error: "Diese Buchung wurde bereits storniert." }, { status: 409 });
  }
  if (booking.status !== "BEZAHLT") {
    return NextResponse.json(
      { error: "Diese Buchung kann in ihrem aktuellen Status nicht mehr online storniert werden." },
      { status: 409 }
    );
  }
  if (!booking.payment?.stripePaymentIntentId) {
    return NextResponse.json({ error: "Zu dieser Buchung liegt keine abgeschlossene Zahlung vor." }, { status: 409 });
  }

  const stundenBisAnreise = (booking.anreise.getTime() - Date.now()) / (1000 * 60 * 60);
  const { erstattungProzent, erstattungCent } = berechneErstattung({
    stundenBisAnreise,
    stornoFristStunden: booking.stornoFristStunden,
    erstattungFruehProzent: booking.stornoErstattungFruehProzent,
    erstattungSpaetProzent: booking.stornoErstattungSpaetProzent,
    betragCent: booking.payment.betragCent,
  });

  try {
    const stripe = getStripe();
    await stripe.refunds.create(
      {
        payment_intent: booking.payment.stripePaymentIntentId,
        amount: erstattungCent,
      },
      { idempotencyKey: `storno-${booking.id}` }
    );
  } catch (error) {
    console.error("Stripe-Erstattung fehlgeschlagen:", error);
    return NextResponse.json({ error: "Erstattung konnte nicht durchgeführt werden." }, { status: 502 });
  }

  const tage = belegteTage(booking.anreise, booking.abreise);
  await prisma.$transaction(async (tx) => {
    await gibKapazitaetFrei(tx, booking.productId, tage);
    await tx.payment.update({
      where: { id: booking.payment!.id },
      data: {
        erstattetCent: erstattungCent,
        status: erstattungCent >= booking.payment!.betragCent ? "ERSTATTET" : "TEILERSTATTET",
      },
    });
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "STORNIERT", storniertAm: new Date(), erstattungProzent },
    });
  });

  await sendeStornoBestaetigung({
    an: booking.customer.email,
    bookingNumber: booking.bookingNumber,
    erstattungProzent,
    erstattetCent: erstattungCent,
  });

  return NextResponse.json({ erstattungProzent, erstattetCent: erstattungCent });
}
