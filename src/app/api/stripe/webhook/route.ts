import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { belegteTage } from "@/lib/date";
import { gibKapazitaetFrei } from "@/lib/capacity";
import { sendeBuchungsbestaetigung } from "@/lib/email";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook nicht konfiguriert." }, { status: 500 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe-Webhook: Signaturprüfung fehlgeschlagen.", error);
    return NextResponse.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "checkout.session.expired":
      await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const payment = await prisma.payment.findUnique({
    where: { stripeCheckoutSessionId: session.id },
    include: { booking: { include: { customer: true, product: true, voucherRedemption: true } } },
  });
  if (!payment) {
    console.error("Webhook: Keine Payment/Booking zu Session gefunden:", session.id);
    return;
  }

  // Idempotenz: Stripe kann denselben Event mehrfach zustellen.
  if (payment.status === "BEZAHLT") return;

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "BEZAHLT", stripePaymentIntentId: paymentIntentId, bezahltAm: new Date() },
    });
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { status: "BEZAHLT" },
    });
    if (payment.booking.voucherRedemption) {
      await tx.voucher.update({
        where: { id: payment.booking.voucherRedemption.id },
        data: { redeemedAt: new Date() },
      });
    }
  });

  await sendeBuchungsbestaetigung({
    an: payment.booking.customer.email,
    bookingNumber: payment.booking.bookingNumber,
    produktName: payment.booking.product.name,
    anreise: payment.booking.anreise,
    abreise: payment.booking.abreise,
    preisGesamtCent: payment.booking.preisGesamtCent,
    flugnummer: payment.booking.rueckflugnummer,
  });
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const payment = await prisma.payment.findUnique({
    where: { stripeCheckoutSessionId: session.id },
    include: { booking: true },
  });
  if (!payment || payment.status !== "OFFEN" || payment.booking.status !== "ANGEFRAGT") {
    return;
  }

  const tage = belegteTage(payment.booking.anreise, payment.booking.abreise);
  await prisma.$transaction(async (tx) => {
    await gibKapazitaetFrei(tx, payment.booking.productId, tage);
    await tx.booking.update({
      where: { id: payment.booking.id },
      data: { status: "STORNIERT", storniertAm: new Date() },
    });
    await tx.voucher.updateMany({
      where: { redeemedBookingId: payment.booking.id, redeemedAt: null },
      data: { redeemedBookingId: null },
    });
  });
}
